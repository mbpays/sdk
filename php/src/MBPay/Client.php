<?php

namespace MBPay;

use MBPay\Exception\MBPayException;
use MBPay\Types\Response;

/**
 * MBPay API 客户端
 */
class Client
{
    /**
     * @var string API 基础地址
     */
    private $baseUrl;

    /**
     * @var string 商户的 App ID
     */
    private $appId;

    /**
     * @var string 商户的 App Secret
     */
    private $appSecret;

    /**
     * @var int HTTP 请求超时时间（秒）
     */
    private $timeout;

    /**
     * 创建新的 MBPay 客户端
     *
     * @param string $baseUrl API 基础地址，例如：https://www.mbpay.world
     * @param string $appId 商户的 App ID
     * @param string $appSecret 商户的 App Secret
     * @param int $timeout HTTP 请求超时时间（秒），默认 30 秒
     */
    public function __construct(string $baseUrl, string $appId, string $appSecret, int $timeout = 30)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->appId = $appId;
        $this->appSecret = $appSecret;
        $this->timeout = $timeout;
    }

    /**
     * 生成签名
     * 规则：排除 sign 字段，按 ASCII 升序排序参数，拼接为 k=v&k2=v2...&key=app_secret，然后 SHA256 哈希
     *
     * @param array $params 参数字典
     * @return string 签名字符串（小写 hex）
     */
    private function generateSign(array $params): string
    {
        // 排除 sign 字段，获取所有键并排序
        $keys = array_filter(array_keys($params), function ($key) {
            return $key !== 'sign';
        });
        sort($keys); // ASCII 升序

        // 拼接签名字符串
        $parts = [];
        foreach ($keys as $key) {
            $parts[] = $key . '=' . $params[$key];
        }
        $signStr = implode('&', $parts) . '&key=' . $this->appSecret;

        // SHA256 哈希并转为小写 hex
        return hash('sha256', $signStr);
    }

    /**
     * 执行 HTTP 请求
     *
     * @param string $method HTTP 方法（GET 或 POST）
     * @param string $path API 路径
     * @param array|null $params 请求参数
     * @return Response 响应对象
     * @throws MBPayException
     */
    private function doRequest(string $method, string $path, ?array $params = null): Response
    {
        if ($params === null) {
            $params = [];
        }

        // 添加必传参数
        $params['app_id'] = $this->appId;
        $params['timestamp'] = (string)time();

        // 生成签名
        $params['sign'] = $this->generateSign($params);

        // 构建 URL
        $url = $this->baseUrl . $path;

        // 初始化 cURL
        $ch = curl_init();

        if (strtoupper($method) === 'GET') {
            // GET 请求：参数放在 URL 中
            $url .= '?' . http_build_query($params);
            curl_setopt($ch, CURLOPT_URL, $url);
        } else {
            // POST 请求：参数放在 FormData 中
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/x-www-form-urlencoded'
            ]);
        }

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        // 执行请求
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($error)) {
            throw new MBPayException(0, 'Request failed: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new MBPayException(0, "HTTP status {$httpCode}");
        }

        // 解析响应
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new MBPayException(0, 'Parse response failed: ' . json_last_error_msg());
        }

        $apiResp = new Response(
            $data['code'] ?? 0,
            $data['message'] ?? '',
            $data['data'] ?? []
        );

        // 检查业务错误
        if (!$apiResp->isSuccess()) {
            throw $apiResp->toException();
        }

        return $apiResp;
    }

    /**
     * 获取商户余额
     *
     * @return Types\BalanceResponse 余额信息
     * @throws MBPayException
     */
    public function getBalance(): Types\BalanceResponse
    {
        $resp = $this->doRequest('POST', '/merchant/balance');

        // 解析 data 字段
        $data = $resp->getData();
        $balance = (int)($data['balance'] ?? 0);
        $frozen = (int)($data['frozen'] ?? 0);

        return new Types\BalanceResponse($balance, $frozen);
    }

    /**
     * 商户向用户地址付款
     *
     * @param Types\PayRequest $req 付款请求
     * @return Types\PayResponse 付款响应
     * @throws MBPayException
     */
    public function pay(Types\PayRequest $req): Types\PayResponse
    {
        // 参数验证
        if (empty($req->getAddress())) {
            throw new MBPayException(0, 'address is required');
        }
        if (empty($req->getOrderNo())) {
            throw new MBPayException(0, 'order_no is required');
        }
        if ($req->getAmount() <= 0) {
            throw new MBPayException(0, 'amount must be greater than 0');
        }

        // 构建请求参数
        $params = [
            'address' => $req->getAddress(),
            'order_no' => $req->getOrderNo(),
            'amount' => (string)$req->getAmount(),
        ];
        if (!empty($req->getRemark())) {
            $params['remark'] = $req->getRemark();
        }

        // 执行请求
        $resp = $this->doRequest('POST', '/merchant/pay', $params);

        // 解析 data 字段
        $data = $resp->getData();
        $platformOrderNo = $data['platform_order_no'] ?? '';
        $actualAmount = (int)($data['actual_amount'] ?? 0);
        $fee = (int)($data['fee'] ?? 0);
        $balance = (int)($data['balance'] ?? 0);

        if (empty($platformOrderNo)) {
            throw new MBPayException(0, 'invalid platform_order_no format in response');
        }

        return new Types\PayResponse($platformOrderNo, $actualAmount, $fee, $balance);
    }

    /**
     * 生成支付链接（用于生成支付二维码）
     * 返回支付链接字符串，格式：mbpay://payorder?data={base64_encoded_json}
     *
     * @param Types\PaymentLinkRequest $req 支付链接生成请求
     * @return string 支付链接字符串
     * @throws MBPayException
     */
    public function generatePaymentLink(Types\PaymentLinkRequest $req): string
    {
        // 参数验证
        if (empty($req->getOrderNo())) {
            throw new MBPayException(0, 'order_no is required');
        }
        if (empty($req->getSubject())) {
            throw new MBPayException(0, 'subject is required');
        }
        if ($req->getAmount() <= 0) {
            throw new MBPayException(0, 'amount must be greater than 0');
        }
        if ($req->getExpire() <= 0) {
            throw new MBPayException(0, 'expire must be greater than 0');
        }

        // 生成 nonce（如果未提供）
        $nonce = $req->getNonce();
        if (empty($nonce)) {
            $nonce = $this->generateNonce(16);
        }

        // 计算过期时间戳（当前时间 + 过期分钟数）
        $expireTs = time() + $req->getExpire() * 60;

        // 构造签名用对象（不含 sign）
        $dataToSign = [
            'app_id' => $this->appId,
            'expire' => $expireTs,
            'nonce' => $nonce,
            'order_no' => $req->getOrderNo(),
            'amount' => $req->getAmount(),
            'subject' => $req->getSubject(),
        ];

        // 如果 notify_url 有值，添加到签名对象中
        if (!empty($req->getNotifyUrl())) {
            $dataToSign['notify_url'] = $req->getNotifyUrl();
        }

        // 生成签名
        $sign = $this->generateSignForPaymentLink($dataToSign);

        // 把 sign 写回数据
        $finalData = $dataToSign;
        $finalData['sign'] = $sign;

        // 将数据转为 JSON 字符串
        $jsonStr = json_encode($finalData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // Base64 编码（标准编码）
        $base64Str = base64_encode($jsonStr);

        // URL 编码（类似 JavaScript 的 encodeURIComponent）
        $encodedBase64 = urlencode($base64Str);

        // 生成支付链接
        return 'mbpay://payorder?data=' . $encodedBase64;
    }

    /**
     * 为支付链接生成签名
     * 规则：排除 sign 字段，按 ASCII 升序排序参数，拼接为 k=v&k2=v2...&key=app_secret，然后 SHA256 哈希
     *
     * @param array $data 数据数组
     * @return string 签名字符串（小写 hex）
     */
    private function generateSignForPaymentLink(array $data): string
    {
        // 将值转为字符串
        $params = [];
        foreach ($data as $k => $v) {
            if ($k !== 'sign') {
                if (is_int($v) || is_float($v)) {
                    // 如果是整数，格式化为整数字符串
                    if (is_float($v) && $v == (int)$v) {
                        $params[$k] = (string)(int)$v;
                    } else {
                        $params[$k] = (string)$v;
                    }
                } else {
                    $params[$k] = (string)$v;
                }
            }
        }

        // 使用已有的签名生成方法
        return $this->generateSign($params);
    }

    /**
     * 生成随机字符串
     *
     * @param int $length 字符串长度
     * @return string 随机字符串
     */
    private function generateNonce(int $length = 16): string
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $result = '';
        for ($i = 0; $i < $length; $i++) {
            $result .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $result;
    }

    /**
     * 生成支付订单并返回收银台页面链接
     *
     * @param Types\PaymentOrderRequest $req 支付订单生成请求
     * @return Types\PaymentOrderResponse 支付订单响应
     * @throws MBPayException
     */
    public function createPaymentOrder(Types\PaymentOrderRequest $req): Types\PaymentOrderResponse
    {
        // 参数验证
        if ($req->getMerchantId() <= 0) {
            throw new MBPayException(0, 'merchant_id is required and must be greater than 0');
        }
        if (empty($req->getOrderNo())) {
            throw new MBPayException(0, 'order_no is required');
        }
        if (empty($req->getSubject())) {
            throw new MBPayException(0, 'subject is required');
        }
        if ($req->getAmount() <= 0) {
            throw new MBPayException(0, 'amount must be greater than 0');
        }
        if (empty($req->getNotifyUrl())) {
            throw new MBPayException(0, 'notify_url is required');
        }

        // 构建请求参数
        $params = [
            'merchant_id' => (string)$req->getMerchantId(),
            'order_no' => $req->getOrderNo(),
            'subject' => $req->getSubject(),
            'amount' => (string)$req->getAmount(),
            'notify_url' => $req->getNotifyUrl(),
        ];

        // 执行请求
        $resp = $this->doRequest('POST', '/merchant/generatepaylink', $params);

        // 解析 data 字段
        $data = $resp->getData();
        $paymentLink = $data['payment_link'] ?? '';

        if (empty($paymentLink)) {
            throw new MBPayException(0, 'invalid payment_link format in response');
        }

        return new Types\PaymentOrderResponse($paymentLink);
    }

    /**
     * 查询订单信息
     *
     * @param string $orderNo 商户订单号
     * @param int $merchantId 商户ID
     * @return Types\OrderInfoResponse 订单信息响应
     * @throws MBPayException
     */
    public function getOrderInfo(string $orderNo, int $merchantId): Types\OrderInfoResponse
    {
        // 参数验证
        if (empty($orderNo)) {
            throw new MBPayException(0, 'order_no is required');
        }
        if ($merchantId <= 0) {
            throw new MBPayException(0, 'merchant_id is required and must be greater than 0');
        }

        // 构建请求参数
        $params = [
            'order_no' => $orderNo,
            'merchant_id' => (string)$merchantId,
        ];

        // 执行请求
        $resp = $this->doRequest('POST', '/merchant/orderinfo', $params);

        // 解析 data 字段
        $data = $resp->getData();
        $orderNoResp = $data['order_no'] ?? '';
        $platformOrderNo = $data['platform_order_no'] ?? '';
        $amount = (int)($data['amount'] ?? 0);
        $platformFee = (int)($data['platform_fee'] ?? 0);
        $status = (int)($data['status'] ?? 0);
        $statusText = $data['status_text'] ?? '';
        $expiresAt = $data['expires_at'] ?? '';
        $createdAt = $data['created_at'] ?? '';
        $paidAt = $data['paid_at'] ?? '';

        if (empty($orderNoResp)) {
            throw new MBPayException(0, 'invalid order_no format in response');
        }

        return new Types\OrderInfoResponse(
            $orderNoResp,
            $platformOrderNo,
            $amount,
            $platformFee,
            $status,
            $statusText,
            $expiresAt,
            $createdAt,
            $paidAt
        );
    }
}






