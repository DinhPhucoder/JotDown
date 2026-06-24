package com.jotdown.api.repository;

import com.jotdown.api.entity.SyncQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SyncQueueRepository extends JpaRepository<SyncQueue, Long> {
}
