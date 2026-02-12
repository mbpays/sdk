<?php

namespace MBPay\Types;

/**
 * 支付订单信息响应
 */
class PayOrderInfoResponse
{
    private $orderNo;           // 商户订单号
    private $platformOrderNo;    // 平台订单号
    private $amount;             // 订单金额
    private $fee;                // 手续费
    private $actualAmount;       // 实际支付金额
    private $status;             // 订单状态
    private $statusText;         // 订单状态文本
    private $remark;             // 备注
    private $createAt;           // 创建时间
    private $updateAt;           // 更新时间
    private $payAddress;        // 收款地址

    /**
     * @param string $orderNo 商户订单号
     * @param string $platformOrderNo 平台订单号
     * @param int $amount 订单金额
     * @param int $fee 手续费
     * @param int $actualAmount 实际支付金额
     * @param int $status 订单状态
     * @param string $statusText 订单状态文本
     * @param string $remark 备注
     * @param string $createAt 创建时间
     * @param string $updateAt 更新时间
     * @param string $payAddress 收款地址
     */
    public function __construct(
        $orderNo,
        $platformOrderNo,
        $amount,
        $fee,
        $actualAmount,
        $status,
        $statusText,
        $remark,
        $createAt,
        $updateAt,
        $payAddress
    ) {
        $this->orderNo = $orderNo;
        $this->platformOrderNo = $platformOrderNo;
        $this->amount = $amount;
        $this->fee = $fee;
        $this->actualAmount = $actualAmount;
        $this->status = $status;
        $this->statusText = $statusText;
        $this->remark = $remark;
        $this->createAt = $createAt;
        $this->updateAt = $updateAt;
        $this->payAddress = $payAddress;
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

    public function getFee()
    {
        return $this->fee;
    }

    public function getActualAmount()
    {
        return $this->actualAmount;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getStatusText()
    {
        return $this->statusText;
    }

    public function getRemark()
    {
        return $this->remark;
    }

    public function getCreateAt()
    {
        return $this->createAt;
    }

    public function getUpdateAt()
    {
        return $this->updateAt;
    }

    public function getPayAddress()
    {
        return $this->payAddress;
    }
}




