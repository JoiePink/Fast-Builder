export interface ProductVO {
    /**
     * 商品ID
     */
    id: string | number;

    /**
     * 商品分类ID
     */
    productTypeId: string | number;

    /**
     * 商品名称
     */
    productName: string;

    /**
     * 状态（0正常 1下架）
     */
    status: string;

    /**
     * 收藏人数
     */
    collectCount: number;

    /**
     * 售出sku总数
     */
    saleCount: number;

    /**
     * 0默认 1推荐
     */
    recommend: number;

    /**
     * 排序
     */
    orders: number;

}

export interface ProductForm extends BaseEntity {
    /**
     * 商品ID
     */
    id?: string | number;

    /**
     * 商品分类ID
     */
    productTypeId?: string | number;

    /**
     * 商品名称
     */
    productName?: string;

    /**
     * 状态（0正常 1下架）
     */
    status?: string;

    /**
     * 收藏人数
     */
    collectCount?: number;

    /**
     * 售出sku总数
     */
    saleCount?: number;

    /**
     * 0默认 1推荐
     */
    recommend?: number;

    /**
     * 排序
     */
    orders?: number;

}

export interface ProductQuery extends PageQuery {

    /**
     * 商品分类ID
     */
    productTypeId?: string | number;

    /**
     * 商品名称
     */
    productName?: string;

    /**
     * 状态（0正常 1下架）
     */
    status?: string;

    /**
     * 收藏人数
     */
    collectCount?: number;

    /**
     * 售出sku总数
     */
    saleCount?: number;

    /**
     * 0默认 1推荐
     */
    recommend?: number;

    /**
     * 排序
     */
    orders?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}
