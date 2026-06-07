export interface ProductTypeVO {
    /**
     * 商品分类ID
     */
    id: string | number;

    /**
     * 上级分类ID
     */
    parentId: string | number;

    /**
     * 商品分类名称
     */
    productTypeName: string;

    /**
     * 商品分类图标
     */
    productTypeIcon: string;

    /**
     * 上级分类信息
     */
    parentStr: string;

    /**
     * 状态（0正常 1下架）
     */
    status: string;

    /**
     * 
     */
    orders: number;

}

export interface ProductTypeForm extends BaseEntity {
    /**
     * 商品分类ID
     */
    id?: string | number;

    /**
     * 上级分类ID
     */
    parentId?: string | number;

    /**
     * 商品分类名称
     */
    productTypeName?: string;

    /**
     * 商品分类图标
     */
    productTypeIcon?: string;

    /**
     * 上级分类信息
     */
    parentStr?: string;

    /**
     * 状态（0正常 1下架）
     */
    status?: string;

    /**
     * 
     */
    orders?: number;

}

export interface ProductTypeQuery extends PageQuery {

    /**
     * 上级分类ID
     */
    parentId?: string | number;

    /**
     * 商品分类名称
     */
    productTypeName?: string;

    /**
     * 商品分类图标
     */
    productTypeIcon?: string;

    /**
     * 上级分类信息
     */
    parentStr?: string;

    /**
     * 状态（0正常 1下架）
     */
    status?: string;

    /**
     * 
     */
    orders?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}
