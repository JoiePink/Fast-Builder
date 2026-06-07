import request from '@/utils/request';

/**
 * 查询商品分类信息列表
 * @param query
 * @returns {*}
 */

export const listProductType = (query?) => {
    return request({
        url: '/api/admin/product/type/list',
        method: 'get',
        params: query
    });
};
export const treeProductType = (query?) => {
    return request({
        url: '/api/admin/product/type/tree',
        method: 'get',
        params: query
    });
};

/**
 * 查询商品分类信息详细
 * @param id
 */
export const getProductType = (id) => {
    return request({
        url: '/api/admin/product/type/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增商品分类信息
 * @param data
 */
export const addProductType = (data) => {
    return request({
        url: '/api/admin/product/type/add',
        method: 'post',
        data: data
    });
};

/**
 * 修改商品分类信息
 * @param data
 */
export const updateProductType = (data) => {
    return request({
        url: '/api/admin/product/type/update',
        method: 'post',
        data: data
    });
};

/**
 * 删除商品分类信息
 * @param id
 */
export const delProductType = (id) => {
    return request({
        url: '/api/admin/product/type/delete',
        method: 'post',
        data: { id }
    });
};

