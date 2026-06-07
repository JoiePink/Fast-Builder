export interface SelfGetAddressVO {
    /**
     * id
     */
    id: string | number;

    /**
     * 地址
     */
    address: string;

    /**
     * 状态（0正常 1锁定）
     */
    status: string;

    /**
     * 排序
     */
    orders: number;

}

export interface SelfGetAddressForm extends BaseEntity {
    /**
     * id
     */
    id?: string | number;

    /**
     * 地址
     */
    address?: string;

    /**
     * 状态（0正常 1锁定）
     */
    status?: string;

    /**
     * 排序
     */
    orders?: number;

}

export interface SelfGetAddressQuery extends PageQuery {

    /**
     * 地址
     */
    address?: string;

    /**
     * 状态（0正常 1锁定）
     */
    status?: string;

    /**
     * 排序
     */
    orders?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}
