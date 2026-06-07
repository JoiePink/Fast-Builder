export interface VipVO {
    /**
     * id
     */
    id: string | number;

    /**
     * vip等级
     */
    level: number;

    /**
     * vip名称
     */
    name: string;

    /**
     * 图标
     */
    icon: string;

    /**
     * 折扣率%
     */
    discountValue: number;

    /**
     * 需求消费金额
     */
    needAmount: number;

    /**
     * 返利积分比例%
     */
    resultBalance: number;

    /**
     * 返利余额比例%
     */
    resultPrice: number;

    /**
     * 帐号状态（0正常 1停用）
     */
    status: string;

}

export interface VipForm extends BaseEntity {
    /**
     * id
     */
    id?: string | number;

    /**
     * vip等级
     */
    level?: number;

    /**
     * vip名称
     */
    name?: string;

    /**
     * 图标
     */
    icon?: string;

    /**
     * 折扣率%
     */
    discountValue?: number;

    /**
     * 需求消费金额
     */
    needAmount?: number;

    /**
     * 返利积分比例%
     */
    resultBalance?: number;

    /**
     * 返利余额比例%
     */
    resultPrice?: number;

    /**
     * 帐号状态（0正常 1停用）
     */
    status?: string;

}

export interface VipQuery extends PageQuery {

    /**
     * vip等级
     */
    level?: number;

    /**
     * vip名称
     */
    name?: string;

    /**
     * 图标
     */
    icon?: string;

    /**
     * 折扣率%
     */
    discountValue?: number;

    /**
     * 需求消费金额
     */
    needAmount?: number;

    /**
     * 返利积分比例%
     */
    resultBalance?: number;

    /**
     * 返利余额比例%
     */
    resultPrice?: number;

    /**
     * 帐号状态（0正常 1停用）
     */
    status?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}
