package com.mbpay.model;

/**
 * 订单信息响应
 */
public class OrderInfoResponse {
    private String orderNo;           // 商户订单号
    private String platformOrderNo;    // 平台订单号
    private long amount;               // 订单金额
    private long platformFee;          // 平台手续费
    private int status;                // 订单状态
    private String statusText;        // 订单状态文本
    private String expiresAt;         // 过期时间
    private String createdAt;          // 创建时间
    private String paidAt;            // 支付时间

    /**
     * @param orderNo 商户订单号
     * @param platformOrderNo 平台订单号
     * @param amount 订单金额
     * @param platformFee 平台手续费
     * @param status 订单状态
     * @param statusText 订单状态文本
     * @param expiresAt 过期时间
     * @param createdAt 创建时间
     * @param paidAt 支付时间
     */
    public OrderInfoResponse(
            String orderNo,
            String platformOrderNo,
            long amount,
            long platformFee,
            int status,
            String statusText,
            String expiresAt,
            String createdAt,
            String paidAt
    ) {
        this.orderNo = orderNo;
        this.platformOrderNo = platformOrderNo;
        this.amount = amount;
        this.platformFee = platformFee;
        this.status = status;
        this.statusText = statusText;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.paidAt = paidAt;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public String getPlatformOrderNo() {
        return platformOrderNo;
    }

    public long getAmount() {
        return amount;
    }

    public long getPlatformFee() {
        return platformFee;
    }

    public int getStatus() {
        return status;
    }

    public String getStatusText() {
        return statusText;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public String getPaidAt() {
        return paidAt;
    }

    @Override
    public String toString() {
        return "OrderInfoResponse{" +
                "orderNo='" + orderNo + '\'' +
                ", platformOrderNo='" + platformOrderNo + '\'' +
                ", amount=" + amount +
                ", platformFee=" + platformFee +
                ", status=" + status +
                ", statusText='" + statusText + '\'' +
                ", expiresAt='" + expiresAt + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", paidAt='" + paidAt + '\'' +
                '}';
    }
}










