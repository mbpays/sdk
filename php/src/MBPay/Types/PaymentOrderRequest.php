<?php

namespace MBPay\Types;

/**
 * 生成支付订单请求参数
 */
class PaymentOrderRequest
{
    private $merchantId;   // 商户ID（必填）
    private $orderNo;      // 商户订单号（必填）
    private $subject;      // 商品描述（必填）
    private $amount;       // 订单金额（分，必填）
    private $notifyUrl;    // 回调通知地址（必填）

    /**
     * @param int $merchantId 商户ID（必填）
     * @param string $orderNo 商户订单号（必填）
     * @param string $subject 商品描述（必填）
     * @param int $amount 订单金额（分，必填）
     * @param string $notifyUrl 回调通知地址（必填）
     */
    public function __construct($merchantId, $orderNo, $subject, $amount, $notifyUrl)
    {
        $this->merchantId = $merchantId;
        $this->orderNo = $orderNo;
        $this->subject = $subject;
        $this->amount = $amount;
        $this->notifyUrl = $notifyUrl;
    }

    public function getMerchantId()
    {
        return $this->merchantId;
    }

    public function getOrderNo()
    {
        return $this->orderNo;
    }

    public function getSubject()
    {
        return $this->subject;
    }

    public function getAmount()
    {
        return $this->amount;
    }

    public function getNotifyUrl()
    {
        return $this->notifyUrl;
    }
}

