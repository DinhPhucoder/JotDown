package com.jotdown.api.service;

import com.jotdown.api.dto.request.ShareNoteRequest;
import com.jotdown.api.dto.request.UpdateShareRequest;
import com.jotdown.api.dto.response.NoteResponse;
import com.jotdown.api.dto.response.NoteShareResponse;
import com.jotdown.api.dto.response.UserResponse;
import com.jotdown.api.entity.Note;
import com.jotdown.api.entity.NoteShare;
import com.jotdown.api.entity.User;
import com.jotdown.api.exception.ForbiddenException;
import com.jotdown.api.exception.ResourceNotFoundException;
import com.jotdown.api.exception.ValidationException;
import com.jotdown.api.repository.NoteRepository;
import com.jotdown.api.repository.NoteShareRepository;
import com.jotdown.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteShareService {

    private final NoteRepository noteRepository;
    private final NoteShareRepository noteShareRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final PusherService pusherService;
    private final NoteService noteService;

    @Transactional
    public NoteShareResponse shareNote(Long noteId, ShareNoteRequest request, User sender) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Ghi chú không tồn tại."));

        // Only the owner can share the note
        if (!note.getUser().getId().equals(sender.getId())) {
            throw new ForbiddenException("Bạn không phải là chủ sở hữu ghi chú này.");
        }

        User receiver = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ValidationException("email", "Email người nhận chưa đăng ký tài khoản."));

        // Prevent self-share
        if (receiver.getId().equals(sender.getId())) {
            throw new ValidationException("email", "Không thể chia sẻ ghi chú với chính bạn.");
        }

        String permission = request.getPermission().trim().toUpperCase();
        if (!"READ".equals(permission) && !"EDIT".equals(permission)) {
            throw new ValidationException("permission", "Quyền chia sẻ chỉ có thể là READ hoặc EDIT.");
        }

        // Restore soft-deleted share if it exists, otherwise create new
        Optional<NoteShare> existingShareOpt = noteShareRepository.findAnyShareWithTrashed(note.getId(), receiver.getId());
        NoteShare share;
        if (existingShareOpt.isPresent()) {
            NoteShare existingShare = existingShareOpt.get();
            noteShareRepository.restoreShare(existingShare.getId(), sender.getId(), permission);
            // Refresh to load from database
            share = noteShareRepository.findById(existingShare.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lỗi khôi phục quyền chia sẻ."));
        } else {
            share = new NoteShare();
            share.setNote(note);
            share.setSender(sender);
            share.setReceiver(receiver);
            share.setPermission(permission);
            share = noteShareRepository.save(share);
        }

        // Send email notification
        mailService.sendNoteSharedMail(note, sender, receiver, permission);

        // Convert note for receiver (masking if protected)
        NoteResponse noteResponse = noteService.convertToNoteResponse(note, receiver.getId(), true);
        UserResponse senderResponse = UserResponse.builder()
                .id(sender.getId())
                .name(sender.getName())
                .email(sender.getEmail())
                .avatar(sender.getAvatar())
                .build();

        // Broadcast realtime
        pusherService.broadcastNoteShared(noteResponse, receiver.getId().toString(), senderResponse, permission);

        return convertToShareResponse(share, receiver.getId());
    }

    @Transactional(readOnly = true)
    public List<NoteShareResponse> listSharedWithMe(User receiver) {
        List<NoteShare> shares = noteShareRepository.findActiveSharesForReceiver(receiver.getId());
        return shares.stream()
                .map(share -> convertToShareResponse(share, receiver.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteShareResponse updateShare(Long noteId, Long shareId, UpdateShareRequest request, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Ghi chú không tồn tại."));

        // Only the owner can manage shares
        if (!note.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Bạn không phải là chủ sở hữu ghi chú này.");
        }

        NoteShare share = noteShareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Quyền chia sẻ không tồn tại."));

        // Ensure share belongs to this note
        if (!share.getNote().getId().equals(noteId)) {
            throw new ValidationException("share", "Quyền chia sẻ không thuộc về ghi chú này.");
        }

        String permission = request.getPermission().trim().toUpperCase();
        if (!"READ".equals(permission) && !"EDIT".equals(permission)) {
            throw new ValidationException("permission", "Quyền chia sẻ chỉ có thể là READ hoặc EDIT.");
        }

        share.setPermission(permission);
        share = noteShareRepository.save(share);

        // Broadcast realtime updating permissions
        NoteResponse noteResponse = noteService.convertToNoteResponse(note, share.getReceiver().getId(), true);
        UserResponse senderResponse = UserResponse.builder()
                .id(share.getSender().getId())
                .name(share.getSender().getName())
                .email(share.getSender().getEmail())
                .avatar(share.getSender().getAvatar())
                .build();

        pusherService.broadcastNoteShared(noteResponse, share.getReceiver().getId().toString(), senderResponse, permission);

        return convertToShareResponse(share, share.getReceiver().getId());
    }

    @Transactional
    public void revokeShare(Long noteId, Long shareId, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Ghi chú không tồn tại."));

        // Only the owner can manage shares
        if (!note.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Bạn không phải là chủ sở hữu ghi chú này.");
        }

        NoteShare share = noteShareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Quyền chia sẻ không tồn tại."));

        // Ensure share belongs to this note
        if (!share.getNote().getId().equals(noteId)) {
            throw new ValidationException("share", "Quyền chia sẻ không thuộc về ghi chú này.");
        }

        Long receiverId = share.getReceiver().getId();

        // Soft delete the share
        noteShareRepository.delete(share);

        // Broadcast realtime revoking permissions
        pusherService.broadcastNoteRevoked(noteId, receiverId.toString());
    }

    private NoteShareResponse convertToShareResponse(NoteShare share, Long currentUserId) {
        if (share == null) return null;

        UserResponse senderResponse = null;
        if (share.getSender() != null) {
            senderResponse = UserResponse.builder()
                    .id(share.getSender().getId())
                    .name(share.getSender().getName())
                    .email(share.getSender().getEmail())
                    .avatar(share.getSender().getAvatar())
                    .build();
        }

        UserResponse receiverResponse = null;
        if (share.getReceiver() != null) {
            receiverResponse = UserResponse.builder()
                    .id(share.getReceiver().getId())
                    .name(share.getReceiver().getName())
                    .email(share.getReceiver().getEmail())
                    .avatar(share.getReceiver().getAvatar())
                    .build();
        }

        NoteResponse noteResponse = null;
        if (share.getNote() != null) {
            noteResponse = noteService.convertToNoteResponse(share.getNote(), currentUserId, true);
        }

        return NoteShareResponse.builder()
                .id(share.getId())
                .noteId(share.getNote().getId())
                .senderId(share.getSender().getId())
                .sender(senderResponse)
                .receiver(receiverResponse)
                .note(noteResponse)
                .permission(share.getPermission())
                .createdAt(share.getCreatedAt())
                .build();
    }
}
