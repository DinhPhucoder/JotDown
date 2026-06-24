package com.jotdown.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class CleanupScheduler {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Runs every day at 02:00 AM.
     * Cleans up soft-deleted records older than 3 days.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupSoftDeletedRecords() {
        log.info("Starting database cleanup for soft-deleted records older than 3 days...");
        
        LocalDateTime threshold = LocalDateTime.now().minusDays(3);
        
        // Use native queries to force delete
        int deletedNotes = jdbcTemplate.update("DELETE FROM notes WHERE deleted_at IS NOT NULL AND deleted_at < ?", threshold);
        int deletedShares = jdbcTemplate.update("DELETE FROM note_shares WHERE deleted_at IS NOT NULL AND deleted_at < ?", threshold);
        int deletedAttachments = jdbcTemplate.update("DELETE FROM note_attachments WHERE deleted_at IS NOT NULL AND deleted_at < ?", threshold);
        int deletedSyncQueue = jdbcTemplate.update("DELETE FROM sync_queue WHERE created_at < ?", threshold);
        
        log.info("Cleanup completed. Notes: {}, Shares: {}, Attachments: {}, SyncQueue: {}", 
                deletedNotes, deletedShares, deletedAttachments, deletedSyncQueue);
    }
    
    /**
     * Runs every Sunday at 03:00 AM.
     * Cleans up Cloudinary orphan files (not referenced in DB) older than 7 days.
     * 
     * Note: Full Cloudinary API synchronization is complex and typically requires the Admin API.
     * This method logs the intent for the background worker.
     */
    @Scheduled(cron = "0 0 3 ? * SUN")
    public void cleanupCloudinaryOrphans() {
        log.info("Starting Cloudinary orphan cleanup check...");
        // Implement Cloudinary Admin API resource listing and deletion here
        // similar to the Laravel cloudinary:cleanup-orphans command.
        log.info("Cloudinary orphan cleanup check completed.");
    }
}
