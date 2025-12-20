package com.mbpay.model;

/**
 * 支付订单信息响应
 */
public class PayOrderInfoResponse {
    private String orderNo;           // 商户订单号
    private String platformOrderNo;   // 平台订单号
    private long amount;              // 订单金额
    private long fee;                 // 手续费
    private long actualAmount;        // 实际支付金额
    private int status;               // 订单状态
    private String statusText;        // 订单状态文本
    private String remark;            // 备注
    private String createAt;          // 创建时间
    private String updateAt;          // 更新时间
    private String payAddress;        // 收款地址

    /**
     * @param orderNo 商户订单号
     * @param platformOrderNo 平台订单号
     * @param amount 订单金额
     * @param fee 手续费
     * @param actualAmount 实际支付金额
     * @param status 订单状态
     * @param statusText 订单状态文本
     * @param remark 备注
     * @param createAt 创建时间
     * @param updateAt 更新时间
     * @param payAddress 收款地址
     */
    public PayOrderInfoResponse(
            String orderNo,
            String platformOrderNo,
            long amount,
            long fee,
            long actualAmount,
            int status,
            String statusText,
            String remark,
            String createAt,
            String updateAt,
            String payAddress
    ) {
        this.orderNo = orderNo;
        this.platformOrderNo = platformOrderNo;
        this.amount = amount;
        this.fee = fee;
        this.actualAmount = actualAmount;
        this.status = status;
        this.statusText = statusText;
        this.remark = remark;
        this.createAt = createAt;
        this.updateAt = updateAt;
        this.payAddress = payAddress;
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

    public long getFee() {
        return fee;
    }

    public long getActualAmount() {
        return actualAmount;
    }

    public int getStatus() {
        return status;
    }

    public String getStatusText() {
        return statusText;
    }

    public String getRemark() {
        return remark;
    }

    public String getCreateAt() {
        return createAt;
    }

    public String getUpdateAt() {
        return updateAt;
    }

    public String getPayAddress() {
        return payAddress;
    }

    @Override
    public String toString() {
        return "PayOrderInfoResponse{" +
                "orderNo='" + orderNo + '\'' +
                ", platformOrderNo='" + platformOrderNo + '\'' +
                ", amount=" + amount +
                ", fee=" + fee +
                ", actualAmount=" + actualAmount +
                ", status=" + status +
                ", statusText='" + statusText + '\'' +
                ", remark='" + remark + '\'' +
                ", createAt='" + createAt + '\'' +
                ", updateAt='" + updateAt + '\'' +
                ", payAddress='" + payAddress + '\'' +
                '}';
    }
}

