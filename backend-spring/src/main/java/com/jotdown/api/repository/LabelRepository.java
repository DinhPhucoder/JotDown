package com.jotdown.api.repository;

import com.jotdown.api.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByUserId(Long userId);
    boolean existsByNameAndUserId(String name, Long userId);
    java.util.Optional<Label> findByUserIdAndName(Long userId, String name);
}

