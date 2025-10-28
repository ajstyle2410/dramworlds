package com.arcitech.inquiry;

import com.arcitech.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping("/inquiries")
    public ApiResponse<InquiryResponse> createInquiry(@Valid @RequestBody InquiryRequest request) {
        return ApiResponse.success("Inquiry submitted", inquiryService.createInquiry(request));
    }

    @GetMapping("/admin/inquiries")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<List<InquiryResponse>> listInquiries() {
        return ApiResponse.success("All inquiries", inquiryService.getAllInquiries());
    }

    @PatchMapping("/admin/inquiries/{inquiryId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<InquiryResponse> updateInquiry(@PathVariable Long inquiryId,
                                                      @Valid @RequestBody InquiryUpdateRequest request) {
        return ApiResponse.success("Inquiry updated", inquiryService.updateInquiry(inquiryId, request));
    }
}
