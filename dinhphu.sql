CREATE TABLE NoteShares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_email VARCHAR(255) NOT NULL,
    permission ENUM('READ', 'EDIT') NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_noteshare_note
        FOREIGN KEY (note_id) REFERENCES notes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_noteshare_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE SyncQueue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    entity_id INT NOT NULL,
    payload JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_syncqueue_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);