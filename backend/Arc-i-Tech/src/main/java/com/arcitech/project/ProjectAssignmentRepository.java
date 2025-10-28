package com.arcitech.project;

import com.arcitech.user.Role;
import com.arcitech.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {
    List<ProjectAssignment> findByProject(Project project);
    List<ProjectAssignment> findByMember(User member);
    @Query("select assignment from ProjectAssignment assignment where assignment.member.id = :memberId")
    List<ProjectAssignment> findByMemberId(@Param("memberId") Long memberId);
    Optional<ProjectAssignment> findByProjectAndMember(Project project, User member);
    List<ProjectAssignment> findByAssignmentRole(Role role);
}
