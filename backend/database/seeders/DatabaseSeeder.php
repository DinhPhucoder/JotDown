<?php

namespace Database\Seeders;

use App\Models\Label;
use App\Models\Note;
use App\Models\NoteAttachment;
use App\Models\NoteShare;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            User::where('email', 'test@example.com')->delete();

            $teacherAccount = User::updateOrCreate(
                ['email' => 'coding1703@gmail.com'],
                [
                    'name' => 'Phan Đình Phú',
                    'password' => '123123123',
                    'email_verified_at' => now(),
                ]
            );

            $collaboratorAccount = User::updateOrCreate(
                ['email' => 'dinhphan1209@gmail.com'],
                [
                    'name' => 'Đinh Phan',
                    'password' => '123123123',
                    'email_verified_at' => now(),
                ]
            );

            $this->seedUserDataset($teacherAccount, [
                'labels' => ['Work', 'Lecture', 'Research', 'Personal', 'Checklist'],
                'notes' => [
                    [
                        'title' => 'Kế hoạch giảng dạy tuần này',
                        'content' => '<p>Chuẩn bị nội dung giảng dạy, cập nhật slide và đề cương ôn tập.</p><ul><li>Cập nhật slide</li><li>Kiểm tra bài tập</li><li>Chốt deadline nộp bài</li></ul>',
                        'color' => '#FFF4D6',
                        'is_pinned' => true,
                        'labels' => ['Work', 'Lecture', 'Checklist'],
                        'attachments' => [
                            [
                                'file_url' => 'https://res.cloudinary.com/dkrag40hw/image/upload/v1777668206/note-attachments/ptdwzirgnnx8hhto8xma.png',
                                'original_name' => 'teaching-plan.png',
                                'file_type' => 'image/png',
                                'file_size' => 248000,
                            ],
                        ],
                        'shares' => [
                            [
                                'receiver' => $collaboratorAccount,
                                'permission' => 'EDIT',
                            ],
                        ],
                    ],
                    [
                        'title' => 'Báo cáo chuyên đề',
                        'content' => '<p>Tổng hợp ý kiến phản biện và các cảnh báo cần sửa trước khi nộp bài.</p>',
                        'color' => '#E7F5FF',
                        'is_protected' => true,
                        'labels' => ['Research', 'Work'],
                        'attachments' => [
                            [
                                'file_url' => 'https://res.cloudinary.com/dkrag40hw/image/upload/v1777571850/note-attachments/jsgcobx3f2a7ijgibjxp.png',
                                'original_name' => 'report-cover.png',
                                'file_type' => 'image/png',
                                'file_size' => 182000,
                            ],
                            [
                                'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/review-notes.pdf',
                                'original_name' => 'review-notes.pdf',
                                'file_type' => 'application/pdf',
                                'attachment_kind' => 'FILE',
                                'file_size' => 412000,
                            ],
                        ],
                    ],
                    [
                        'title' => 'Ý tưởng minh họa cho buổi học',
                        'content' => '<p>Mô tả cách trình bày realtime và chia sẻ ghi chú trong buổi bảo vệ.</p>',
                        'color' => '#F3F0FF',
                        'labels' => ['Lecture', 'Personal'],
                    ],
                ],
            ]);

            $this->seedUserDataset($collaboratorAccount, [
                'labels' => ['Realtime', 'Demo', 'Feedback', 'Study'],
                'notes' => [
                    [
                        'title' => 'Demo cộng tác realtime',
                        'content' => '<p>Ghi chú để test đồng bộ thời gian thực giữa 2 tài khoản.</p>',
                        'color' => '#D3F9D8',
                        'is_pinned' => true,
                        'labels' => ['Realtime', 'Demo'],
                        'attachments' => [
                            [
                                'file_url' => 'https://res.cloudinary.com/dkrag40hw/image/upload/v1777668206/note-attachments/ptdwzirgnnx8hhto8xma.png',
                                'original_name' => 'realtime-demo.png',
                                'file_type' => 'image/png',
                                'file_size' => 196000,
                            ],
                        ],
                        'shares' => [
                            [
                                'receiver' => $teacherAccount,
                                'permission' => 'READ',
                            ],
                        ],
                    ],
                    [
                        'title' => 'Danh sách câu hỏi bảo vệ',
                        'content' => '<p>Tập hợp các câu hỏi giảng viên có thể hỏi trong buổi chấm điểm.</p><ol><li>Lý do chọn kiến trúc này</li><li>Xử lý share note như thế nào</li><li>Cơ chế đồng bộ realtime</li></ol>',
                        'color' => '#FFE3E3',
                        'is_protected' => true,
                        'labels' => ['Feedback', 'Study'],
                    ],
                    [
                        'title' => 'Gợi ý nâng cấp đề tài',
                        'content' => '<p>Các ý tưởng mở rộng: phân quyền theo nhóm, lịch sử phiên bản và thống kê sử dụng.</p>',
                        'color' => '#E3FAFC',
                        'labels' => ['Demo', 'Study'],
                    ],
                ],
            ]);
        });
    }

    private function seedUserDataset(User $user, array $data): void
    {
        $labels = collect($data['labels'] ?? [])
            ->mapWithKeys(fn (string $labelName) => [
                $labelName => Label::updateOrCreate(
                    ['user_id' => $user->id, 'name' => $labelName],
                    []
                ),
            ]);

        foreach ($data['notes'] ?? [] as $noteData) {
            $note = Note::updateOrCreate(
                ['user_id' => $user->id, 'title' => $noteData['title']],
                [
                    'content' => $noteData['content'] ?? null,
                    'color' => $noteData['color'] ?? '#ffffff',
                    'is_pinned' => (bool) ($noteData['is_pinned'] ?? false),
                    'pinned_at' => !empty($noteData['is_pinned']) ? now() : null,
                    'is_protected' => (bool) ($noteData['is_protected'] ?? false),
                    'password' => !empty($noteData['is_protected']) ? '123123123' : null,
                    'version' => 1,
                ]
            );

            $labelIds = collect($noteData['labels'] ?? [])
                ->map(fn (string $labelName) => $labels[$labelName]->id)
                ->values()
                ->all();

            DB::table('note_labels')
                ->where('note_id', $note->id)
                ->where('user_id', $user->id)
                ->delete();

            if (!empty($labelIds)) {
                DB::table('note_labels')->insert(
                    array_map(
                        fn (int $labelId): array => [
                            'note_id' => $note->id,
                            'label_id' => $labelId,
                            'user_id' => $user->id,
                        ],
                        $labelIds
                    )
                );
            }

            foreach ($noteData['attachments'] ?? [] as $attachmentData) {
                NoteAttachment::updateOrCreate(
                    [
                        'note_id' => $note->id,
                        'file_url' => $attachmentData['file_url'],
                    ],
                    [
                        'attachment_kind' => $attachmentData['attachment_kind'] ?? 'IMAGE',
                        'original_name' => $attachmentData['original_name'] ?? null,
                        'file_type' => $attachmentData['file_type'] ?? null,
                        'file_size' => (int) ($attachmentData['file_size'] ?? 0),
                    ]
                );
            }

            foreach ($noteData['shares'] ?? [] as $shareData) {
                NoteShare::updateOrCreate(
                    [
                        'note_id' => $note->id,
                        'sender_id' => $user->id,
                        'receiver_id' => $shareData['receiver']->id,
                    ],
                    [
                        'permission' => strtoupper($shareData['permission'] ?? 'READ'),
                    ]
                );
            }
        }
    }
}
