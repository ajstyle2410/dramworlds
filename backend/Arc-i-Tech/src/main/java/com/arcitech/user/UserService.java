package com.arcitech.user;

import com.arcitech.user.dto.UserManagementRequest;
import com.arcitech.user.dto.UserStatusUpdateRequest;
import com.arcitech.user.dto.UserUpdateRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<UserProfile> listStaff() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.SUB_ADMIN || user.getRole() == Role.DEVELOPER)
                .map(UserProfile::from)
                .toList();
    }

    public List<UserProfile> listByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(UserProfile::from)
                .toList();
    }

    public UserProfile createUser(UserManagementRequest request, User actor) {
        Role requestedRole = request.role();
        validateCreate(actor, requestedRole);
        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email().toLowerCase())
                .password(passwordEncoder.encode(request.password()))
                .role(requestedRole)
                .active(true)
                .build();
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("An account with that email already exists.");
        }
        return UserProfile.from(userRepository.save(user));
    }

    public UserProfile updateUser(Long userId, UserUpdateRequest request, User actor) {
        User target = getUserById(userId);
        validateManage(actor, target);

        if (request.fullName() != null && !request.fullName().isBlank()) {
            target.setFullName(request.fullName().trim());
        }
        if (request.email() != null) {
            String email = request.email().trim().toLowerCase();
            if (!email.equalsIgnoreCase(target.getEmail()) && userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Another user with that email already exists.");
            }
            target.setEmail(email);
        }
        if (request.password() != null && !request.password().isBlank()) {
            target.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.role() != null && request.role() != target.getRole()) {
            validateRoleTransition(actor, target, request.role());
            target.setRole(request.role());
        }

        return UserProfile.from(userRepository.save(target));
    }

    public UserProfile updateStatus(Long userId, UserStatusUpdateRequest request, User actor) {
        User target = getUserById(userId);
        validateManage(actor, target);
        boolean active = Boolean.TRUE.equals(request.active());
        target.setActive(active);
        return UserProfile.from(userRepository.save(target));
    }

    public void deleteUser(Long userId, User actor) {
        User target = getUserById(userId);
        validateDeletion(actor, target);
        userRepository.delete(target);
    }

    public User createCustomer(String fullName, String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with that email already exists.");
        }
        User user = User.builder()
                .fullName(fullName)
                .email(email.toLowerCase())
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.CUSTOMER)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    public User createAdminIfMissing(String fullName, String email, String rawPassword) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User admin = User.builder()
                            .fullName(fullName)
                            .email(email.toLowerCase())
                            .password(passwordEncoder.encode(rawPassword))
                            .role(Role.SUPER_ADMIN)
                            .active(true)
                            .build();
                    return userRepository.save(admin);
                });
    }

    public User createSubAdmin(String fullName, String email, String rawPassword) {
        return createStaffMember(fullName, email, rawPassword, Role.SUB_ADMIN);
    }

    public User createDeveloper(String fullName, String email, String rawPassword) {
        return createStaffMember(fullName, email, rawPassword, Role.DEVELOPER);
    }

    public User createStaffMember(String fullName, String email, String rawPassword, Role role) {
        if (role != Role.SUB_ADMIN && role != Role.DEVELOPER) {
            throw new IllegalArgumentException("Only sub-admin or developer accounts can be provisioned");
        }
        return createUserWithRole(fullName, email, rawPassword, role);
    }

    private User createUserWithRole(String fullName, String email, String rawPassword, Role role) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with that email already exists.");
        }
        User user = User.builder()
                .fullName(fullName)
                .email(email.toLowerCase())
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    public List<UserProfile> getSubAdmins() {
        return listByRole(Role.SUB_ADMIN);
    }

    public List<UserProfile> getDevelopers() {
        return listByRole(Role.DEVELOPER);
    }

    public List<UserProfile> getCustomers() {
        return listByRole(Role.CUSTOMER);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id " + id));
    }

    private void validateCreate(User actor, Role requestedRole) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (actor.getRole() == Role.SUB_ADMIN) {
            if (!EnumSet.of(Role.DEVELOPER, Role.CUSTOMER).contains(requestedRole)) {
                throw new AccessDeniedException("Sub-admins can only create developers or customers.");
            }
            return;
        }
        throw new AccessDeniedException("Only privileged users can create accounts.");
    }

    private void validateManage(User actor, User target) {
        if (actor.getId().equals(target.getId())) {
            return;
        }
        if (target.getRole() == Role.SUPER_ADMIN && actor.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("You cannot update a super-admin account.");
        }
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (actor.getRole() == Role.SUB_ADMIN) {
            if (target.getRole() == Role.DEVELOPER || target.getRole() == Role.CUSTOMER) {
                return;
            }
            throw new AccessDeniedException("Sub-admins can only manage developers or customers.");
        }
        throw new AccessDeniedException("Insufficient permissions to manage users.");
    }

    private void validateDeletion(User actor, User target) {
        if (target.getId().equals(actor.getId())) {
            throw new IllegalArgumentException("You cannot delete your own account.");
        }
        if (target.getRole() == Role.SUPER_ADMIN && actor.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("You cannot delete a super-admin account.");
        }
        if (actor.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only super-admins can delete accounts.");
        }
    }

    private void validateRoleTransition(User actor, User target, Role requestedRole) {
        if (target.getRole() == Role.SUPER_ADMIN || requestedRole == Role.SUPER_ADMIN) {
            if (actor.getRole() != Role.SUPER_ADMIN) {
                throw new AccessDeniedException("Only super-admins can modify super-admin roles.");
            }
        }
        if (actor.getRole() == Role.SUB_ADMIN) {
            Set<Role> manageableRoles = EnumSet.of(Role.DEVELOPER, Role.CUSTOMER);
            if (!manageableRoles.contains(target.getRole()) || !manageableRoles.contains(requestedRole)) {
                throw new AccessDeniedException("Sub-admins can only change between developer and customer roles.");
            }
        }
    }
}
