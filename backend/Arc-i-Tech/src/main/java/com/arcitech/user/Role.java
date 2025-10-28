package com.arcitech.user;

public enum Role {
    SUPER_ADMIN,
    SUB_ADMIN,
    DEVELOPER,
    CUSTOMER;

    public String asAuthority() {
        return "ROLE_" + name();
    }
}
