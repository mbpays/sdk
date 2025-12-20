<?php

namespace MBPay\Types;

/**
 * 订单信息响应
 */
class OrderInfoResponse
{
    private $orderNo;           // 商户订单号
    private $platformOrderNo;   // 平台订单号
    private $amount;            // 订单金额
    private $platformFee;       // 平台手续费
    private $status;            // 订单状态
    private $statusText;        // 订单状态文本
    private $expiresAt;         // 过期时间
    private $createdAt;         // 创建时间
    private $paidAt;            // 支付时间

    /**
     * @param string $orderNo 商户订单号
     * @param string $platformOrderNo 平台订单号
     * @param int $amount 订单金额
     * @param int $platformFee 平台手续费
     * @param int $status 订单状态
     * @param string $statusText 订单状态文本
     * @param string $expiresAt 过期时间
     * @param string $createdAt 创建时间
     * @param string $paidAt 支付时间
     */
    public function __construct(
        $orderNo,
        $platformOrderNo,
        $amount,
        $platformFee,
        $status,
        $statusText,
        $expiresAt,
        $createdAt,
        $paidAt
    ) {
        $this->orderNo = $orderNo;
        $this->platformOrderNo = $platformOrderNo;
        $this->amount = $amount;
        $this->platformFee = $platformFee;
        $this->status = $status;
        $this->statusText = $statusText;
        $this->expiresAt = $expiresAt;
        $this->createdAt = $createdAt;
        $this->paidAt = $paidAt;
    }

    public function getOrderNo()
    {
        return $this->orderNo;
    }

    public function getPlatformOrderNo()
    {
        return $this->platformOrderNo;
    }

    public function getAmount()
    {
        return $this->amount;
    }

    public function getPlatformFee()
    {
        return $this->platformFee;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getStatusText()
    {
        return $this->statusText;
    }

    public function getExpiresAt()
    {
        return $this->expiresAt;
    }

    public function getCreatedAt()
    {
        return $this->createdAt;
    }

    public function getPaidAt()
    {
        return $this->paidAt;
    }
}







