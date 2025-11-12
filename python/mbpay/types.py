"""类型定义和错误处理"""

from typing import Dict, Any, Optional


class ErrorCode:
    """错误码常量"""
    SUCCESS = 0
    APP_ID_EMPTY = 12000
    SIGN_EMPTY = 12001
    TIMESTAMP_EMPTY = 12002
    MERCHANT_NOT_EXISTS = 12003
    SIGN_ERROR = 12005
    PARAM_ERROR = 12006
    MERCHANT_NOT_EXISTS2 = 12007
    MERCHANT_STATUS_ERROR = 12008
    MERCHANT_NOT_EXISTS3 = 12009
    INSUFFICIENT_BALANCE = 12010
    ORDER_EXISTS_OR_ADDR_NOT_FOUND = 12011
    SYSTEM_ERROR = 12012


class MBPayError(Exception):
    """MBPay API 自定义错误"""
    
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(f"MBPay API Error [{code}]: {message}")


class Response:
    """API 统一返回结构"""
    
    def __init__(self, code: int, message: str, data: Dict[str, Any]):
        self.code = code
        self.message = message
        self.data = data
    
    def is_success(self) -> bool:
        """检查响应是否成功"""
        return self.code == ErrorCode.SUCCESS
    
    def to_error(self) -> Optional[MBPayError]:
        """将响应转换为错误"""
        if self.is_success():
            return None
        return MBPayError(self.code, self.message)


class BalanceResponse:
    """余额查询响应"""
    
    def __init__(self, balance: int, frozen: int):
        self.balance = balance  # 可用余额（MB）
        self.frozen = frozen     # 冻结余额（MB）
    
    def __repr__(self):
        return f"BalanceResponse(balance={self.balance}, frozen={self.frozen})"


class PayResponse:
    """付款响应"""
    
    def __init__(
        self,
        platform_order_no: str,
        actual_amount: int,
        fee: int,
        balance: int
    ):
        self.platform_order_no = platform_order_no  # 平台订单号
        self.actual_amount = actual_amount           # 实际支付金额（MB）
        self.fee = fee                               # 手续费（MB）
        self.balance = balance                       # 商户剩余余额（MB）
    
    def __repr__(self):
        return (
            f"PayResponse(platform_order_no={self.platform_order_no}, "
            f"actual_amount={self.actual_amount}, fee={self.fee}, balance={self.balance})"
        )


class PaymentLinkRequest:
    """支付链接生成请求参数"""
    
    def __init__(
        self,
        order_no: str,
        subject: str,
        amount: int,
        expire: int,
        nonce: Optional[str] = None,
        notify_url: Optional[str] = None
    ):
        self.order_no = order_no      # 商户订单号（必填）
        self.subject = subject         # 商品描述（必填）
        self.amount = amount           # 订单金额（分，必填）
        self.expire = expire           # 过期时间（分钟，必填）
        self.nonce = nonce             # 随机数（可选，不填会自动生成）
        self.notify_url = notify_url   # 回调通知地址（可选）


class PayRequest:
    """付款请求参数"""
    
    def __init__(self, address: str, order_no: str, amount: int, remark: str = ""):
        """
        付款请求参数
        
        Args:
            address: 收款地址（必填）
            order_no: 商户订单号（必填）
            amount: 付款金额（MB，必填，最小单位：100 = 1MB）
            remark: 备注（可选）
        """
        self.address = address
        self.order_no = order_no
        self.amount = amount
        self.remark = remark


class PaymentOrderRequest:
    """生成支付订单请求参数"""
    
    def __init__(
        self,
        merchant_id: int,
        order_no: str,
        subject: str,
        amount: int,
        notify_url: str
    ):
        """
        生成支付订单请求参数
        
        Args:
            merchant_id: 商户ID（必填）
            order_no: 商户订单号（必填）
            subject: 商品描述（必填）
            amount: 订单金额（分，必填）
            notify_url: 回调通知地址（必填）
        """
        self.merchant_id = merchant_id
        self.order_no = order_no
        self.subject = subject
        self.amount = amount
        self.notify_url = notify_url


class PaymentOrderResponse:
    """生成支付订单响应"""
    
    def __init__(self, payment_link: str):
        """
        生成支付订单响应
        
        Args:
            payment_link: 收银台页面链接
        """
        self.payment_link = payment_link
    
    def __repr__(self):
        return f"PaymentOrderResponse(payment_link={self.payment_link})"

