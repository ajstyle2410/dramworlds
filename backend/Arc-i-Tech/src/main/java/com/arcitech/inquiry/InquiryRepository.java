package com.arcitech.inquiry;

import com.arcitech.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByProject(Project project);
}
