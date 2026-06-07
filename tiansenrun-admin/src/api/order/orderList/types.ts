export interface OrderVO {
    /**
     * id
     */
    id: string | number;

    /**
     * 订单号
     */
    orderNo: string;

    /**
     * 用户ID
     */
    appUserId: string | number;

    /**
     * 商品数
     */
    totalQuantity: number;

    /**
     * 总额
     */
    totalAmount: number;

    /**
     * 会员抵扣金额
     */
    vipDiscountAmount: number;

    /**
     * 总抵扣金额
     */
    discountAmount: number;

    /**
     * 实际金额
     */
    realAmount: number;

    /**
     * 收货地址
     */
    address: string;

    /**
     * 用户备注
     */
    appUserRemark: string;

    /**
     * 展示图
     */
    image: string;

    /**
     * 展示图Url
     */
    imageUrl: string;
    /**
     * 订单类型 1普通订单
     */
    orderType: number;

    /**
     * 运费
     */
    freightAmount: number;

    /**
     * 支付时间
     */
    payTime: string;

    /**
     * 完成时间
     */
    finishTime: string;

    /**
     * 过期时间
     */
    expireTime: string;

    /**
     * 发货时间
     */
    deliveryTime: string;

    /**
     * 订单状态 0待支付 1已支付 2已发货 3已完成 4已过期 5已退货
     */
    orderStatus: number;

    /**
     * 
     */
    userCouponId: string | number;

    /**
     * 
     */
    couponAmount: number;

    /**
     * 
     */
    isNext: number;

    /**
     * 
     */
    lastSignInTime: string;

    /**
     * 
     */
    alreadySignInDay: number;

    /**
     * 
     */
    signInOpenStatus: number;

    /**
     * 
     */
    alreadyOpenStatus: number;

}

export interface OrderForm extends BaseEntity {
    /**
     * id
     */
    id?: string | number;

    /**
     * 订单号
     */
    orderNo?: string;

    /**
     * 用户ID
     */
    appUserId?: string | number;

    /**
     * 商品数
     */
    totalQuantity?: number;

    /**
     * 总额
     */
    totalAmount?: number;

    /**
     * 会员抵扣金额
     */
    vipDiscountAmount?: number;

    /**
     * 总抵扣金额
     */
    discountAmount?: number;

    /**
     * 实际金额
     */
    realAmount?: number;

    /**
     * 收货地址
     */
    address?: string;

    /**
     * 用户备注
     */
    appUserRemark?: string;

    /**
     * 展示图
     */
    image?: string;

    /**
     * 订单类型 1普通订单
     */
    orderType?: number;

    /**
     * 运费
     */
    freightAmount?: number;

    /**
     * 支付时间
     */
    payTime?: string;

    /**
     * 完成时间
     */
    finishTime?: string;

    /**
     * 过期时间
     */
    expireTime?: string;

    /**
     * 发货时间
     */
    deliveryTime?: string;

    /**
     * 订单状态 0待支付 1已支付 2已发货 3已完成 4已过期 5已退货
     */
    orderStatus?: number;

    /**
     * 
     */
    userCouponId?: string | number;

    /**
     * 
     */
    couponAmount?: number;

    /**
     * 
     */
    isNext?: number;

    /**
     * 
     */
    lastSignInTime?: string;

    /**
     * 
     */
    alreadySignInDay?: number;

    /**
     * 
     */
    signInOpenStatus?: number;

    /**
     * 
     */
    alreadyOpenStatus?: number;

}

export interface OrderQuery extends PageQuery {

    /**
     * 订单号
     */
    orderNo?: string;

    /**
     * 用户ID
     */
    appUserId?: string | number;

    /**
     * 商品数
     */
    totalQuantity?: number;

    /**
     * 总额
     */
    totalAmount?: number;

    /**
     * 会员抵扣金额
     */
    vipDiscountAmount?: number;

    /**
     * 总抵扣金额
     */
    discountAmount?: number;

    /**
     * 实际金额
     */
    realAmount?: number;

    /**
     * 收货地址
     */
    address?: string;

    /**
     * 用户备注
     */
    appUserRemark?: string;

    /**
     * 展示图
     */
    image?: string;

    /**
     * 订单类型 1普通订单
     */
    orderType?: number;

    /**
     * 运费
     */
    freightAmount?: number;

    /**
     * 支付时间
     */
    payTime?: string;

    /**
     * 完成时间
     */
    finishTime?: string;

    /**
     * 过期时间
     */
    expireTime?: string;

    /**
     * 发货时间
     */
    deliveryTime?: string;

    /**
     * 订单状态 0待支付 1已支付 2已发货 3已完成 4已过期 5已退货
     */
    orderStatus?: number;

    /**
     * 
     */
    userCouponId?: string | number;

    /**
     * 
     */
    couponAmount?: number;

    /**
     * 
     */
    isNext?: number;

    /**
     * 
     */
    lastSignInTime?: string;

    /**
     * 
     */
    alreadySignInDay?: number;

    /**
     * 
     */
    signInOpenStatus?: number;

    /**
     * 
     */
    alreadyOpenStatus?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}
