package com.mbpay.model;

/**
 * 生成支付订单请求参数
 */
public class PaymentOrderRequest {
    private long merchantId;   // 商户ID（必填）
    private String orderNo;    // 商户订单号（必填）
    private String subject;     // 商品描述（必填）
    private long amount;        // 订单金额（分，必填）
    private String notifyUrl;   // 回调通知地址（必填）

    /**
     * @param merchantId 商户ID（必填）
     * @param orderNo 商户订单号（必填）
     * @param subject 商品描述（必填）
     * @param amount 订单金额（分，必填）
     * @param notifyUrl 回调通知地址（必填）
     */
    public PaymentOrderRequest(long merchantId, String orderNo, String subject, long amount, String notifyUrl) {
        this.merchantId = merchantId;
        this.orderNo = orderNo;
        this.subject = subject;
        this.amount = amount;
        this.notifyUrl = notifyUrl;
    }

    public long getMerchantId() {
        return merchantId;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public String getSubject() {
        return subject;
    }

    public long getAmount() {
        return amount;
    }

    public String getNotifyUrl() {
        return notifyUrl;
    }
}

