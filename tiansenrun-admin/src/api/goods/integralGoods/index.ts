import request from '@/utils/request';

// 查询商品基本信息列表
export const listProduct = (query?: any) => {
    return request({
        url: '/api/admin/product/list',
        method: 'get',
        params: query
    });
};

// 查询商品基本信息详细
export const getProduct = (id: any) => {
    return request({
        url: '/api/admin/product/detail',
        method: 'get',
        params: { id }
    });
};

// 新增商品基本信息
export const addProduct = (data: any) => {
    return request({
        url: '/api/admin/product/add',
        method: 'post',
        data: data
    });
};

// 修改商品基本信息
export const updateProduct = (data: any) => {
    return request({
        url: '/api/admin/product/update',
        method: 'post',
        data: data
    });
};

// 删除商品基本信息
export const delProduct = (id: any) => {
    return request({
        url: '/api/admin/product/delete',
        method: 'post',
        data: { productId: id }
    });
};
