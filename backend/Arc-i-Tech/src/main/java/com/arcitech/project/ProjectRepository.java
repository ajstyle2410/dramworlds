package com.arcitech.project;

import com.arcitech.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByHighlightedTrueOrderByUpdatedAtDesc();
    List<Project> findByClientOrderByUpdatedAtDesc(User client);
    Optional<Project> findByName(String name);
}
