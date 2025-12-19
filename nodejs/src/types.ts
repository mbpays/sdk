/**
 * 类型定义
 */

import { MBPayError } from './error';

/**
 * API 统一返回结构
 */
export class Response {
    private code: number;
    private message: string;
    private data: Record<string, any>;

    constructor(code: number, message: string, data: Record<string, any>) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 检查响应是否成功
     */
    isSuccess(): boolean {
        return this.code === 0;
    }

    /**
     * 将响应转换为错误
     */
    toError(): MBPayError {
        return new MBPayError(this.code, this.message);
    }

    /**
     * 获取错误码
     */
    getCode(): number {
        return this.code;
    }

    /**
     * 获取错误信息
     */
    getMessage(): string {
        return this.message;
    }

    /**
     * 获取返回数据
     */
    getData(): Record<string, any> {
        return this.data;
    }
}

/**
 * 余额查询响应
 */
export class BalanceResponse {
    private balance: number;
    private frozen: number;

    constructor(balance: number, frozen: number) {
        this.balance = balance; // 可用余额（MB）
        this.frozen = frozen;   // 冻结余额（MB）
    }

    getBalance(): number {
        return this.balance;
    }

    getFrozen(): number {
        return this.frozen;
    }
}

/**
 * 付款响应
 */
export class PayResponse {
    private platformOrderNo: string;
    private actualAmount: number;
    private fee: number;
    private balance: number;

    constructor(platformOrderNo: string, actualAmount: number, fee: number, balance: number) {
        this.platformOrderNo = platformOrderNo; // 平台订单号
        this.actualAmount = actualAmount;       // 实际支付金额（MB）
        this.fee = fee;                         // 手续费（MB）
        this.balance = balance;                 // 商户剩余余额（MB）
    }

    getPlatformOrderNo(): string {
        return this.platformOrderNo;
    }

    getActualAmount(): number {
        return this.actualAmount;
    }

    getFee(): number {
        return this.fee;
    }

    getBalance(): number {
        return this.balance;
    }
}

/**
 * 付款请求参数
 */
export class PayRequest {
    private address: string;
    private orderNo: string;
    private amount: number;
    private remark: string;

    /**
     * @param address 收款地址（必填）
     * @param orderNo 商户订单号（必填）
     * @param amount 付款金额（MB，必填，最小单位：100 = 1MB）
     * @param remark 备注（可选）
     */
    constructor(address: string, orderNo: string, amount: number, remark: string = '') {
        this.address = address;
        this.orderNo = orderNo;
        this.amount = amount;
        this.remark = remark;
    }

    getAddress(): string {
        return this.address;
    }

    getOrderNo(): string {
        return this.orderNo;
    }

    getAmount(): number {
        return this.amount;
    }

    getRemark(): string {
        return this.remark;
    }
}

/**
 * 支付链接生成请求参数
 */
export class PaymentLinkRequest {
    private orderNo: string;
    private subject: string;
    private amount: number;
    private expire: number;
    private nonce?: string;
    private notifyUrl?: string;

    /**
     * @param orderNo 商户订单号（必填）
     * @param subject 商品描述（必填）
     * @param amount 订单金额（分，必填）
     * @param expire 过期时间（分钟，必填）
     * @param nonce 随机数（可选，不填会自动生成）
     * @param notifyUrl 回调通知地址（可选）
     */
    constructor(
        orderNo: string,
        subject: string,
        amount: number,
        expire: number,
        nonce?: string,
        notifyUrl?: string
    ) {
        this.orderNo = orderNo;
        this.subject = subject;
        this.amount = amount;
        this.expire = expire;
        this.nonce = nonce;
        this.notifyUrl = notifyUrl;
    }

    getOrderNo(): string {
        return this.orderNo;
    }

    getSubject(): string {
        return this.subject;
    }

    getAmount(): number {
        return this.amount;
    }

    getExpire(): number {
        return this.expire;
    }

    getNonce(): string | undefined {
        return this.nonce;
    }

    getNotifyUrl(): string | undefined {
        return this.notifyUrl;
    }
}

/**
 * 生成支付订单请求参数
 */
export class PaymentOrderRequest {
    private merchantId: number;
    private orderNo: string;
    private subject: string;
    private amount: number;
    private notifyUrl: string;

    /**
     * @param merchantId 商户ID（必填）
     * @param orderNo 商户订单号（必填）
     * @param subject 商品描述（必填）
     * @param amount 订单金额（分，必填）
     * @param notifyUrl 回调通知地址（必填）
     */
    constructor(
        merchantId: number,
        orderNo: string,
        subject: string,
        amount: number,
        notifyUrl: string
    ) {
        this.merchantId = merchantId;
        this.orderNo = orderNo;
        this.subject = subject;
        this.amount = amount;
        this.notifyUrl = notifyUrl;
    }

    getMerchantId(): number {
        return this.merchantId;
    }

    getOrderNo(): string {
        return this.orderNo;
    }

    getSubject(): string {
        return this.subject;
    }

    getAmount(): number {
        return this.amount;
    }

    getNotifyUrl(): string {
        return this.notifyUrl;
    }
}

/**
 * 生成支付订单响应
 */
export class PaymentOrderResponse {
    private paymentLink: string;

    /**
     * @param paymentLink 收银台页面链接
     */
    constructor(paymentLink: string) {
        this.paymentLink = paymentLink;
    }

    getPaymentLink(): string {
        return this.paymentLink;
    }
}

/**
 * 订单信息响应
 */
export class OrderInfoResponse {
    private orderNo: string;
    private platformOrderNo: string;
    private amount: number;
    private platformFee: number;
    private status: number;
    private statusText: string;
    private expiresAt: string;
    private createdAt: string;
    private paidAt: string;

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
    constructor(
        orderNo: string,
        platformOrderNo: string,
        amount: number,
        platformFee: number,
        status: number,
        statusText: string,
        expiresAt: string,
        createdAt: string,
        paidAt: string
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

    getOrderNo(): string {
        return this.orderNo;
    }

    getPlatformOrderNo(): string {
        return this.platformOrderNo;
    }

    getAmount(): number {
        return this.amount;
    }

    getPlatformFee(): number {
        return this.platformFee;
    }

    getStatus(): number {
        return this.status;
    }

    getStatusText(): string {
        return this.statusText;
    }

    getExpiresAt(): string {
        return this.expiresAt;
    }

    getCreatedAt(): string {
        return this.createdAt;
    }

    getPaidAt(): string {
        return this.paidAt;
    }
}






