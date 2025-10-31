package com.arcitech.programs;

import com.arcitech.common.ApiResponse;
import com.arcitech.programs.dto.CreateProductAccessRequest;
import com.arcitech.programs.dto.DecideProductAccessRequest;
import com.arcitech.programs.dto.ProductAccessRequestDto;
import com.arcitech.user.User;
import com.arcitech.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.arcitech.programs.ProductAccessMapper.toDto;

@Service
@RequiredArgsConstructor
public class ProductAccessService {

    private final ProductAccessRequestRepository requestRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ApiResponse<List<ProductAccessRequestDto>> getRequestsForUser(long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        List<ProductAccessRequestDto> payload = requestRepository
                .findByUserOrderBySubmittedAtDesc(user)
                .stream()
                .map(ProductAccessMapper::toDto)
                .toList();
        return ApiResponse.success(payload);
    }

    @Transactional
    public ApiResponse<ProductAccessRequestDto> createRequest(long userId, CreateProductAccessRequest payload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        ProductAccessRequest existing = requestRepository
                .findTopByUserAndProductKeyOrderBySubmittedAtDesc(user, payload.productKey())
                .orElse(null);
        if (existing != null) {
            if (existing.getStatus() == ProductAccessStatus.PENDING) {
                return ApiResponse.success("Request already pending", toDto(existing));
            }
            if (existing.getStatus() == ProductAccessStatus.APPROVED) {
                return ApiResponse.success("Access already granted", toDto(existing));
            }
        }

        ProductAccessRequest entity = ProductAccessRequest.builder()
                .user(user)
                .productKey(payload.productKey())
                .status(ProductAccessStatus.PENDING)
                .build();
        ProductAccessRequest saved = requestRepository.save(entity);
        return ApiResponse.success("Request submitted", toDto(saved));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<ProductAccessRequestDto>> getPendingRequests() {
        List<ProductAccessRequestDto> payload = requestRepository
                .findByStatusOrderBySubmittedAtAsc(ProductAccessStatus.PENDING)
                .stream()
                .map(ProductAccessMapper::toDto)
                .toList();
        return ApiResponse.success(payload);
    }

    @Transactional
    public ApiResponse<ProductAccessRequestDto> decide(long requestId,
                                                       long actorId,
                                                       DecideProductAccessRequest payload) {
        ProductAccessRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Access request not found"));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));

        request.setStatus(payload.status());
        request.setNote(payload.note());
        request.setDecidedAt(java.time.OffsetDateTime.now());
        request.setDecidedBy(actor);

        return ApiResponse.success("Request updated", toDto(request));
    }

    @Transactional(readOnly = true)
    public ApiResponse<ProductAccessRequestDto> latestDecisionForUser(long userId, DashboardProductKey productKey) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return requestRepository
                .findTopByUserAndProductKeyOrderBySubmittedAtDesc(user, productKey)
                .map(ProductAccessMapper::toDto)
                .map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.success(null));
    }
}
