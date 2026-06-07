export interface OrderRefundVO {
    /**
     * id
     */
    id: string | number;

    /**
     * 用户id
     */
    userId: string | number;

    /**
     * 订单id
     */
    orderId: string | number;

    /**
     * 订单类型 1普通 2积分
     */
    orderType: number;

    /**
     * 退款数额
     */
    refundAmount: number;

    /**
     * 图片
     */
    images: string;

    /**
     * 详情
     */
    userDetail: string;

    /**
     * 微信申请退款入参
     */
    refundWechatSendValue: string;

    /**
     * 微信申请退款返回
     */
    refundWechatResultValue: string;

    /**
     * 帐号状态（0待审核 1已退款 2已驳回）
     */
    status: string;

    /**
     * 订单号
     */
    orderNo: string;

    /**
     * 
     */
    serverDetail: string;

    /**
     * 1仅退款 2退货退款
     */
    refundType: number;

    /**
     * 物流单号
     */
    trackingNo: string;

    /**
     * 
     */
    image: string;

    /**
     * Url
     */
    imageUrl: string;
    /**
     * 
     */
    remark: string;

}

export interface OrderRefundForm extends BaseEntity {
    /**
     * id
     */
    id?: string | number;

    /**
     * 用户id
     */
    userId?: string | number;

    /**
     * 订单id
     */
    orderId?: string | number;

    /**
     * 订单类型 1普通 2积分
     */
    orderType?: number;

    /**
     * 退款数额
     */
    refundAmount?: number;

    /**
     * 图片
     */
    images?: string;

    /**
     * 详情
     */
    userDetail?: string;

    /**
     * 微信申请退款入参
     */
    refundWechatSendValue?: string;

    /**
     * 微信申请退款返回
     */
    refundWechatResultValue?: string;

    /**
     * 帐号状态（0待审核 1已退款 2已驳回）
     */
    status?: string;

    /**
     * 订单号
     */
    orderNo?: string;

    /**
     * 
     */
    serverDetail?: string;

    /**
     * 1仅退款 2退货退款
     */
    refundType?: number;

    /**
     * 物流单号
     */
    trackingNo?: string;

    /**
     * 
     */
    image?: string;

    /**
     * 
     */
    remark?: string;

}

export interface OrderRefundQuery extends PageQuery {

    /**
     * 用户id
     */
    userId?: string | number;

    /**
     * 订单id
     */
    orderId?: string | number;

    /**
     * 订单类型 1普通 2积分
     */
    orderType?: number;

    /**
     * 退款数额
     */
    refundAmount?: number;

    /**
     * 图片
     */
    images?: string;

    /**
     * 详情
     */
    userDetail?: string;

    /**
     * 微信申请退款入参
     */
    refundWechatSendValue?: string;

    /**
     * 微信申请退款返回
     */
    refundWechatResultValue?: string;

    /**
     * 帐号状态（0待审核 1已退款 2已驳回）
     */
    status?: string;

    /**
     * 订单号
     */
    orderNo?: string;

    /**
     * 
     */
    serverDetail?: string;

    /**
     * 1仅退款 2退货退款
     */
    refundType?: number;

    /**
     * 物流单号
     */
    trackingNo?: string;

    /**
     * 
     */
    image?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}
