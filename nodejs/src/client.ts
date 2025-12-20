/**
 * MBPay API 客户端
 */

import crypto from 'crypto';
import https from 'https';
import http from 'http';
import { URL, URLSearchParams } from 'url';
import { Response, BalanceResponse, PayResponse, PaymentLinkRequest, PayRequest, PaymentOrderRequest, PaymentOrderResponse, OrderInfoResponse, PayOrderInfoResponse } from './types';
import { MBPayError } from './error';

export class Client {
    private baseUrl: string;
    private appId: string;
    private appSecret: string;
    private timeout: number;

    /**
     * 创建新的 MBPay 客户端
     *
     * @param baseUrl API 基础地址，例如：https://www.mbpay.world
     * @param appId 商户的 App ID
     * @param appSecret 商户的 App Secret
     * @param timeout HTTP 请求超时时间（毫秒），默认 30000
     */
    constructor(baseUrl: string, appId: string, appSecret: string, timeout: number = 30000) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.appId = appId;
        this.appSecret = appSecret;
        this.timeout = timeout;
    }

    /**
     * 生成签名
     * 规则：排除 sign 字段，按 ASCII 升序排序参数，拼接为 k=v&k2=v2...&key=app_secret，然后 SHA256 哈希
     *
     * @param params 参数字典
     * @returns 签名字符串（小写 hex）
     */
    private generateSign(params: Record<string, string>): string {
        // 排除 sign 字段，获取所有键并排序
        const keys = Object.keys(params)
            .filter(k => k !== 'sign')
            .sort(); // ASCII 升序

        // 拼接签名字符串
        const parts = keys.map(k => `${k}=${params[k]}`);
        const signStr = parts.join('&') + `&key=${this.appSecret}`;

        // SHA256 哈希并转为小写 hex
        return crypto.createHash('sha256').update(signStr).digest('hex');
    }

    /**
     * 执行 HTTP 请求
     *
     * @param method HTTP 方法（GET 或 POST）
     * @param path API 路径
     * @param params 请求参数
     * @returns Promise<Response>
     * @throws MBPayError
     */
    private async doRequest(
        method: string,
        path: string,
        params?: Record<string, string>
    ): Promise<Response> {
        const requestParams: Record<string, string> = params || {};

        // 添加必传参数
        requestParams['app_id'] = this.appId;
        requestParams['timestamp'] = Math.floor(Date.now() / 1000).toString();

        // 生成签名
        requestParams['sign'] = this.generateSign(requestParams);

        // 构建 URL
        const url = new URL(this.baseUrl + path);

        return new Promise((resolve, reject) => {
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            let postData: string | undefined;
            let requestPath: string;

            if (method.toUpperCase() === 'GET') {
                // GET 请求：参数放在 URL 中
                Object.keys(requestParams).forEach(key => {
                    url.searchParams.set(key, requestParams[key]);
                });
                requestPath = url.pathname + url.search;
            } else {
                // POST 请求：参数放在 FormData 中
                const formData = new URLSearchParams();
                Object.keys(requestParams).forEach(key => {
                    formData.append(key, requestParams[key]);
                });
                postData = formData.toString();
                requestPath = url.pathname + url.search;
            }

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: requestPath,
                method: method.toUpperCase(),
                headers: method.toUpperCase() === 'POST' ? {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData ? Buffer.byteLength(postData) : 0
                } : {}
            };

            const req = httpModule.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new MBPayError(0, `HTTP status ${res.statusCode}`));
                        return;
                    }

                    try {
                        const result = JSON.parse(data);
                        const apiResp = new Response(
                            result.code || 0,
                            result.message || '',
                            result.data || {}
                        );

                        // 检查业务错误
                        if (!apiResp.isSuccess()) {
                            reject(apiResp.toError());
                            return;
                        }

                        resolve(apiResp);
                    } catch (error) {
                        reject(new MBPayError(0, `Parse response failed: ${error}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new MBPayError(0, `Request failed: ${error.message}`));
            });

            req.setTimeout(this.timeout, () => {
                req.destroy();
                reject(new MBPayError(0, 'Request timeout'));
            });

            if (postData) {
                req.write(postData);
            }

            req.end();
        });
    }

    /**
     * 获取商户余额
     *
     * @returns Promise<BalanceResponse>
     * @throws MBPayError
     */
    async getBalance(): Promise<BalanceResponse> {
        const resp = await this.doRequest('POST', '/merchant/balance');

        // 解析 data 字段
        const data = resp.getData();
        const balance = parseInt(String(data.balance || 0), 10);
        const frozen = parseInt(String(data.frozen || 0), 10);

        return new BalanceResponse(balance, frozen);
    }

    /**
     * 商户向用户地址付款
     *
     * @param req 付款请求
     * @returns Promise<PayResponse>
     * @throws MBPayError
     */
    async pay(req: PayRequest): Promise<PayResponse> {
        // 参数验证
        if (!req.getAddress()) {
            throw new MBPayError(0, 'address is required');
        }
        if (!req.getOrderNo()) {
            throw new MBPayError(0, 'order_no is required');
        }
        if (req.getAmount() <= 0) {
            throw new MBPayError(0, 'amount must be greater than 0');
        }

        // 构建请求参数
        const params: Record<string, string> = {
            address: req.getAddress(),
            order_no: req.getOrderNo(),
            amount: req.getAmount().toString(),
        };
        if (req.getRemark()) {
            params.remark = req.getRemark();
        }

        // 执行请求
        const resp = await this.doRequest('POST', '/merchant/pay', params);

        // 解析 data 字段
        const data = resp.getData();
        const platformOrderNo = data.platform_order_no || '';
        const actualAmount = parseInt(String(data.actual_amount || 0), 10);
        const fee = parseInt(String(data.fee || 0), 10);
        const balance = parseInt(String(data.balance || 0), 10);

        if (!platformOrderNo) {
            throw new MBPayError(0, 'invalid platform_order_no format in response');
        }

        return new PayResponse(platformOrderNo, actualAmount, fee, balance);
    }

    /**
     * 生成支付链接（用于生成支付二维码）
     * 返回支付链接字符串，格式：mbpay://payorder?data={base64_encoded_json}
     *
     * @param req 支付链接生成请求
     * @returns Promise<string>
     * @throws MBPayError
     */
    async generatePaymentLink(req: PaymentLinkRequest): Promise<string> {
        // 参数验证
        if (!req.getOrderNo()) {
            throw new MBPayError(0, 'order_no is required');
        }
        if (!req.getSubject()) {
            throw new MBPayError(0, 'subject is required');
        }
        if (req.getAmount() <= 0) {
            throw new MBPayError(0, 'amount must be greater than 0');
        }
        if (req.getExpire() <= 0) {
            throw new MBPayError(0, 'expire must be greater than 0');
        }

        // 生成 nonce（如果未提供）
        let nonce = req.getNonce();
        if (!nonce) {
            nonce = this.generateNonce(16);
        }

        // 计算过期时间戳（当前时间 + 过期分钟数）
        const expireTs = Math.floor(Date.now() / 1000) + req.getExpire() * 60;

        // 构造签名用对象（不含 sign）
        const dataToSign: Record<string, any> = {
            app_id: this.appId,
            expire: expireTs,
            nonce: nonce,
            order_no: req.getOrderNo(),
            amount: req.getAmount(),
            subject: req.getSubject(),
        };

        // 如果 notify_url 有值，添加到签名对象中
        if (req.getNotifyUrl()) {
            dataToSign.notify_url = req.getNotifyUrl();
        }

        // 生成签名
        const sign = this.generateSignForPaymentLink(dataToSign);

        // 把 sign 写回数据
        const finalData = { ...dataToSign, sign };

        // 将数据转为 JSON 字符串
        const jsonStr = JSON.stringify(finalData);

        // Base64 编码（标准编码）
        const base64Str = Buffer.from(jsonStr).toString('base64');

        // URL 编码（类似 JavaScript 的 encodeURIComponent）
        const encodedBase64 = encodeURIComponent(base64Str);

        // 生成支付链接
        return `mbpay://payorder?data=${encodedBase64}`;
    }

    /**
     * 为支付链接生成签名
     * 规则：排除 sign 字段，按 ASCII 升序排序参数，拼接为 k=v&k2=v2...&key=app_secret，然后 SHA256 哈希
     *
     * @param data 数据对象
     * @returns 签名字符串（小写 hex）
     */
    private generateSignForPaymentLink(data: Record<string, any>): string {
        // 将值转为字符串
        const params: Record<string, string> = {};
        Object.keys(data).forEach(k => {
            if (k !== 'sign') {
                const v = data[k];
                if (typeof v === 'number') {
                    // 如果是整数，格式化为整数字符串
                    if (v === Math.floor(v)) {
                        params[k] = Math.floor(v).toString();
                    } else {
                        params[k] = v.toString();
                    }
                } else {
                    params[k] = String(v);
                }
            }
        });

        // 使用已有的签名生成方法
        return this.generateSign(params);
    }

    /**
     * 生成随机字符串
     *
     * @param length 字符串长度
     * @returns 随机字符串
     */
    private generateNonce(length: number = 16): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 生成支付订单并返回收银台页面链接
     *
     * @param req 支付订单生成请求
     * @returns Promise<PaymentOrderResponse>
     * @throws MBPayError
     */
    async createPaymentOrder(req: PaymentOrderRequest): Promise<PaymentOrderResponse> {
        // 参数验证
        if (req.getMerchantId() <= 0) {
            throw new MBPayError(0, 'merchant_id is required and must be greater than 0');
        }
        if (!req.getOrderNo()) {
            throw new MBPayError(0, 'order_no is required');
        }
        if (!req.getSubject()) {
            throw new MBPayError(0, 'subject is required');
        }
        if (req.getAmount() <= 0) {
            throw new MBPayError(0, 'amount must be greater than 0');
        }
        if (!req.getNotifyUrl()) {
            throw new MBPayError(0, 'notify_url is required');
        }

        // 构建请求参数
        const params: Record<string, string> = {
            merchant_id: String(req.getMerchantId()),
            order_no: req.getOrderNo(),
            subject: req.getSubject(),
            amount: String(req.getAmount()),
            notify_url: req.getNotifyUrl(),
        };

        // 执行请求
        const resp = await this.doRequest('POST', '/merchant/generatepaylink', params);

        // 解析 data 字段
        const data = resp.getData();
        const paymentLink = data.payment_link as string;

        if (!paymentLink) {
            throw new MBPayError(0, 'invalid payment_link format in response');
        }

        return new PaymentOrderResponse(paymentLink);
    }

    /**
     * 查询订单信息
     *
     * @param orderNo 商户订单号
     * @param merchantId 商户ID
     * @returns Promise<OrderInfoResponse>
     * @throws MBPayError
     */
    async getOrderInfo(orderNo: string, merchantId: number): Promise<OrderInfoResponse> {
        // 参数验证
        if (!orderNo) {
            throw new MBPayError(0, 'order_no is required');
        }
        if (merchantId <= 0) {
            throw new MBPayError(0, 'merchant_id is required and must be greater than 0');
        }

        // 构建请求参数
        const params: Record<string, string> = {
            order_no: orderNo,
            merchant_id: String(merchantId),
        };

        // 执行请求
        const resp = await this.doRequest('POST', '/merchant/orderinfo', params);

        // 解析 data 字段
        const data = resp.getData();
        const orderNoResp = data.order_no as string || '';
        const platformOrderNo = data.platform_order_no as string || '';
        const amount = parseInt(String(data.amount || 0), 10);
        const platformFee = parseInt(String(data.platform_fee || 0), 10);
        const status = parseInt(String(data.status || 0), 10);
        const statusText = data.status_text as string || '';
        const expiresAt = data.expires_at as string || '';
        const createdAt = data.created_at as string || '';
        const paidAt = data.paid_at as string || '';

        if (!orderNoResp) {
            throw new MBPayError(0, 'invalid order_no format in response');
        }

        return new OrderInfoResponse(
            orderNoResp,
            platformOrderNo,
            amount,
            platformFee,
            status,
            statusText,
            expiresAt,
            createdAt,
            paidAt
        );
    }

    /**
     * 查询支付订单信息
     *
     * @param orderNo 商户订单号
     * @param merchantId 商户ID
     * @returns Promise<PayOrderInfoResponse>
     * @throws MBPayError
     */
    async getPayOrderInfo(orderNo: string, merchantId: number): Promise<PayOrderInfoResponse> {
        // 参数验证
        if (!orderNo) {
            throw new MBPayError(0, 'order_no is required');
        }
        if (merchantId <= 0) {
            throw new MBPayError(0, 'merchant_id is required and must be greater than 0');
        }

        // 构建请求参数
        const params: Record<string, string> = {
            order_no: orderNo,
            merchant_id: String(merchantId),
        };

        // 执行请求
        const resp = await this.doRequest('POST', '/merchant/payorderinfo', params);

        // 解析 data 字段
        const data = resp.getData();
        const orderNoResp = data.order_no as string || '';
        const platformOrderNo = data.platform_order_no as string || '';
        const amount = parseInt(String(data.amount || 0), 10);
        const fee = parseInt(String(data.fee || 0), 10);
        const actualAmount = parseInt(String(data.actual_amount || 0), 10);
        const status = parseInt(String(data.status || 0), 10);
        const statusText = data.status_text as string || '';
        const remark = data.remark as string || '';
        const createAt = data.create_at as string || '';
        const updateAt = data.update_at as string || '';
        const payAddress = data.pay_address as string || '';

        if (!orderNoResp) {
            throw new MBPayError(0, 'invalid order_no format in response');
        }

        return new PayOrderInfoResponse(
            orderNoResp,
            platformOrderNo,
            amount,
            fee,
            actualAmount,
            status,
            statusText,
            remark,
            createAt,
            updateAt,
            payAddress
        );
    }
}






