package com.mbpay;

import com.mbpay.exception.MBPayException;
import com.mbpay.model.*;
import com.mbpay.util.HttpUtil;

import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * MBPay API 客户端
 */
public class Client {
    private String baseUrl;
    private String appId;
    private String appSecret;
    private int timeout;

    /**
     * 创建新的 MBPay 客户端
     *
     * @param baseUrl API 基础地址，例如：https://www.mbpay.world
     * @param appId 商户的 App ID
     * @param appSecret 商户的 App Secret
     * @param timeout HTTP 请求超时时间（毫秒），默认 30000
     */
    public Client(String baseUrl, String appId, String appSecret, int timeout) {
        this.baseUrl = baseUrl.replaceAll("/$", "");
        this.appId = appId;
        this.appSecret = appSecret;
        this.timeout = timeout;
    }

    /**
     * 创建新的 MBPay 客户端（默认超时时间 30 秒）
     *
     * @param baseUrl API 基础地址
     * @param appId 商户的 App ID
     * @param appSecret 商户的 App Secret
     */
    public Client(String baseUrl, String appId, String appSecret) {
        this(baseUrl, appId, appSecret, 30000);
    }

    /**
     * 生成签名
     * 规则：排除 sign 字段，按 ASCII 升序排序参数，拼接为 k=v&k2=v2...&key=app_secret，然后 SHA256 哈希
     *
     * @param params 参数字典
     * @return 签名字符串（小写 hex）
     */
    private String generateSign(Map<String, String> params) {
        // 排除 sign 字段，获取所有键并排序
        Map<String, String> sortedParams = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!"sign".equals(entry.getKey())) {
                sortedParams.put(entry.getKey(), entry.getValue());
            }
        }

        // 拼接签名字符串
        StringBuilder signStr = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (signStr.length() > 0) {
                signStr.append("&");
            }
            signStr.append(entry.getKey()).append("=").append(entry.getValue());
        }
        signStr.append("&key=").append(this.appSecret);

        // SHA256 哈希并转为小写 hex
        return HttpUtil.sha256Hex(signStr.toString());
    }

    /**
     * 执行 HTTP 请求
     *
     * @param method HTTP 方法（GET 或 POST）
     * @param path API 路径
     * @param params 请求参数
     * @return Response 响应对象
     * @throws MBPayException
     */
    private Response doRequest(String method, String path, Map<String, String> params) throws MBPayException {
        if (params == null) {
            params = new HashMap<>();
        }

        // 添加必传参数
        params.put("app_id", this.appId);
        params.put("timestamp", String.valueOf(System.currentTimeMillis() / 1000));

        // 生成签名
        params.put("sign", generateSign(params));

        // 构建 URL
        String url = this.baseUrl + path;

        try {
            String responseBody;
            if ("GET".equalsIgnoreCase(method)) {
                responseBody = HttpUtil.get(url, params, this.timeout);
            } else {
                responseBody = HttpUtil.post(url, params, this.timeout);
            }

            // 解析响应
            Response response = HttpUtil.parseResponse(responseBody);

            // 检查业务错误
            if (!response.isSuccess()) {
                throw response.toException();
            }

            return response;
        } catch (Exception e) {
            if (e instanceof MBPayException) {
                throw e;
            }
            throw new MBPayException(0, "Request failed: " + e.getMessage());
        }
    }

    /**
     * 获取商户余额
     *
     * @return BalanceResponse 余额信息
     * @throws MBPayException
     */
    public BalanceResponse getBalance() throws MBPayException {
        Response resp = doRequest("POST", "/merchant/balance", new HashMap<>());

        // 解析 data 字段
        Map<String, Object> data = resp.getData();
        long balance = Long.parseLong(String.valueOf(data.getOrDefault("balance", 0)));
        long frozen = Long.parseLong(String.valueOf(data.getOrDefault("frozen", 0)));

        return new BalanceResponse(balance, frozen);
    }

    /**
     * 商户向用户地址付款
     *
     * @param req 付款请求
     * @return PayResponse 付款响应
     * @throws MBPayException
     */
    public PayResponse pay(PayRequest req) throws MBPayException {
        // 参数验证
        if (req.getAddress() == null || req.getAddress().isEmpty()) {
            throw new MBPayException(0, "address is required");
        }
        if (req.getOrderNo() == null || req.getOrderNo().isEmpty()) {
            throw new MBPayException(0, "order_no is required");
        }
        if (req.getAmount() <= 0) {
            throw new MBPayException(0, "amount must be greater than 0");
        }

        // 构建请求参数
        Map<String, String> params = new HashMap<>();
        params.put("address", req.getAddress());
        params.put("order_no", req.getOrderNo());
        params.put("amount", String.valueOf(req.getAmount()));
        if (req.getRemark() != null && !req.getRemark().isEmpty()) {
            params.put("remark", req.getRemark());
        }

        // 执行请求
        Response resp = doRequest("POST", "/merchant/pay", params);

        // 解析 data 字段
        Map<String, Object> data = resp.getData();
        String platformOrderNo = String.valueOf(data.get("platform_order_no"));
        long actualAmount = Long.parseLong(String.valueOf(data.getOrDefault("actual_amount", 0)));
        long fee = Long.parseLong(String.valueOf(data.getOrDefault("fee", 0)));
        long balance = Long.parseLong(String.valueOf(data.getOrDefault("balance", 0)));

        if (platformOrderNo == null || platformOrderNo.isEmpty() || "null".equals(platformOrderNo)) {
            throw new MBPayException(0, "invalid platform_order_no format in response");
        }

        return new PayResponse(platformOrderNo, actualAmount, fee, balance);
    }

    /**
     * 生成支付链接（用于生成支付二维码）
     * 返回支付链接字符串，格式：mbpay://payorder?data={base64_encoded_json}
     *
     * @param req 支付链接生成请求
     * @return 支付链接字符串
     * @throws MBPayException
     */
    public String generatePaymentLink(PaymentLinkRequest req) throws MBPayException {
        // 参数验证
        if (req.getOrderNo() == null || req.getOrderNo().isEmpty()) {
            throw new MBPayException(0, "order_no is required");
        }
        if (req.getSubject() == null || req.getSubject().isEmpty()) {
            throw new MBPayException(0, "subject is required");
        }
        if (req.getAmount() <= 0) {
            throw new MBPayException(0, "amount must be greater than 0");
        }
        if (req.getExpire() <= 0) {
            throw new MBPayException(0, "expire must be greater than 0");
        }

        // 生成 nonce（如果未提供）
        String nonce = req.getNonce();
        if (nonce == null || nonce.isEmpty()) {
            nonce = generateNonce(16);
        }

        // 计算过期时间戳（当前时间 + 过期分钟数）
        long expireTs = System.currentTimeMillis() / 1000 + req.getExpire() * 60;

        // 构造签名用对象（不含 sign）
        Map<String, Object> dataToSign = new HashMap<>();
        dataToSign.put("app_id", this.appId);
        dataToSign.put("expire", expireTs);
        dataToSign.put("nonce", nonce);
        dataToSign.put("order_no", req.getOrderNo());
        dataToSign.put("amount", req.getAmount());
        dataToSign.put("subject", req.getSubject());

        // 如果 notify_url 有值，添加到签名对象中
        if (req.getNotifyUrl() != null && !req.getNotifyUrl().isEmpty()) {
            dataToSign.put("notify_url", req.getNotifyUrl());
        }

        // 生成签名
        String sign = generateSignForPaymentLink(dataToSign);

        // 把 sign 写回数据
        Map<String, Object> finalData = new HashMap<>(dataToSign);
        finalData.put("sign", sign);

        // 将数据转为 JSON 字符串
        String jsonStr = HttpUtil.toJson(finalData);

        // Base64 编码（标准编码）
        String base64Str = HttpUtil.base64Encode(jsonStr);

        // URL 编码（类似 JavaScript 的 encodeURIComponent）
        String encodedBase64 = HttpUtil.urlEncode(base64Str);

        // 生成支付链接
        return "mbpay://payorder?data=" + encodedBase64;
    }

    /**
     * 为支付链接生成签名
     * 规则：排除 sign 字段，按 ASCII 升序排序参数，拼接为 k=v&k2=v2...&key=app_secret，然后 SHA256 哈希
     *
     * @param data 数据对象
     * @return 签名字符串（小写 hex）
     */
    private String generateSignForPaymentLink(Map<String, Object> data) {
        // 将值转为字符串
        Map<String, String> params = new HashMap<>();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!"sign".equals(entry.getKey())) {
                Object v = entry.getValue();
                if (v instanceof Number) {
                    // 如果是整数，格式化为整数字符串
                    if (v instanceof Double && ((Double) v) == Math.floor((Double) v)) {
                        params.put(entry.getKey(), String.valueOf(((Double) v).longValue()));
                    } else {
                        params.put(entry.getKey(), String.valueOf(v));
                    }
                } else {
                    params.put(entry.getKey(), String.valueOf(v));
                }
            }
        }

        // 使用已有的签名生成方法
        return generateSign(params);
    }

    /**
     * 生成随机字符串
     *
     * @param length 字符串长度
     * @return 随机字符串
     */
    private String generateNonce(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * chars.length());
            result.append(chars.charAt(index));
        }
        return result.toString();
    }

    /**
     * 生成支付订单并返回收银台页面链接
     *
     * @param req 支付订单生成请求
     * @return PaymentOrderResponse 支付订单响应
     * @throws MBPayException
     */
    public model.PaymentOrderResponse createPaymentOrder(model.PaymentOrderRequest req) throws MBPayException {
        // 参数验证
        if (req.getMerchantId() <= 0) {
            throw new MBPayException(0, "merchant_id is required and must be greater than 0");
        }
        if (req.getOrderNo() == null || req.getOrderNo().isEmpty()) {
            throw new MBPayException(0, "order_no is required");
        }
        if (req.getSubject() == null || req.getSubject().isEmpty()) {
            throw new MBPayException(0, "subject is required");
        }
        if (req.getAmount() <= 0) {
            throw new MBPayException(0, "amount must be greater than 0");
        }
        if (req.getNotifyUrl() == null || req.getNotifyUrl().isEmpty()) {
            throw new MBPayException(0, "notify_url is required");
        }

        // 构建请求参数
        Map<String, String> params = new HashMap<>();
        params.put("merchant_id", String.valueOf(req.getMerchantId()));
        params.put("order_no", req.getOrderNo());
        params.put("subject", req.getSubject());
        params.put("amount", String.valueOf(req.getAmount()));
        params.put("notify_url", req.getNotifyUrl());

        // 执行请求
        Response resp = doRequest("POST", "/merchant/generatepaylink", params);

        // 解析 data 字段
        Map<String, Object> data = resp.getData();
        String paymentLink = (String) data.get("payment_link");

        if (paymentLink == null || paymentLink.isEmpty()) {
            throw new MBPayException(0, "invalid payment_link format in response");
        }

        return new model.PaymentOrderResponse(paymentLink);
    }
}






