package com.jotdown.api.service;

import com.jotdown.api.dto.request.StoreLabelRequest;
import com.jotdown.api.dto.request.UpdateLabelRequest;
import com.jotdown.api.dto.response.LabelResponse;
import com.jotdown.api.entity.Label;
import com.jotdown.api.entity.User;
import com.jotdown.api.exception.ForbiddenException;
import com.jotdown.api.exception.ResourceNotFoundException;
import com.jotdown.api.exception.ValidationException;
import com.jotdown.api.repository.LabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabelService {

    private final LabelRepository labelRepository;

    @Transactional(readOnly = true)
    public List<LabelResponse> listLabels(User currentUser) {
        List<Label> labels = labelRepository.findByUserId(currentUser.getId());
        return labels.stream()
                .map(this::toLabelResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LabelResponse createLabel(StoreLabelRequest request, User currentUser) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (labelRepository.existsByNameAndUserId(name, currentUser.getId())) {
            throw new ValidationException("name", "Nhãn này đã tồn tại");
        }

        Label label = new Label();
        label.setUser(currentUser);
        label.setName(name);

        Label saved = labelRepository.save(label);
        return toLabelResponse(saved);
    }

    @Transactional
    public LabelResponse updateLabel(Long id, UpdateLabelRequest request, User currentUser) {
        Label label = labelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhãn không tồn tại."));

        if (!label.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Forbidden.");
        }

        if (request.getName() != null) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(label.getName())) {
                if (labelRepository.existsByNameAndUserId(newName, currentUser.getId())) {
                    throw new ValidationException("name", "Nhãn này đã tồn tại");
                }
                label.setName(newName);
            }
        }

        Label saved = labelRepository.save(label);
        return toLabelResponse(saved);
    }

    @Transactional
    public void deleteLabel(Long id, User currentUser) {
        Label label = labelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhãn không tồn tại."));

        if (!label.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Forbidden.");
        }

        labelRepository.delete(label);
    }

    private LabelResponse toLabelResponse(Label label) {
        return LabelResponse.builder()
                .id(label.getId())
                .name(label.getName())
                .build();
    }
}
