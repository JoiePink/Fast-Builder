import request from '@/utils/request';


// 自提核销
export const orderSelfGetVerify = (data: any) => {
    return request({
        url: '/admin/order/selfGetVerify',
        method: 'post',
        data: data
    });
};

// 订单物流信息
export const orderexpressDetail = (query?: any) => {
    return request({
        url: '/admin/order/express/detail',
        method: 'get',
        params: query
    });
};

// 微信运力公司信息查询
export const orderDeliveryList = (query?: any) => {
    return request({
        url: '/admin/order/expressCompany/list',
        method: 'get',
        params: query
    });
};

// 订单发货
export const orderShipping = (data: any) => {
    return request({
        url: '/admin/order/subscribe',
        method: 'post',
        data: data
    });
};

/**
 * 查询订单信息列表
 * @param query
 * @returns {*}
 */

export const listOrder = (query?: any) => {
    return request({
        url: '/admin/order/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询订单信息详细
 * @param id
 */
export const getOrder = (id: string | number) => {
    return request({
        url: '/admin/order/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增订单信息
 * @param data
 */
export const addOrder = (data: any) => {
    return request({
        url: '/system/order',
        method: 'post',
        data: data
    });
};

/**
 * 修改订单信息
 * @param data
 */
export const updateOrder = (data: any) => {
    return request({
        url: '/system/order',
        method: 'put',
        data: data
    });
};

/**
 * 删除订单信息
 * @param id
 */
export const delOrder = (id: string | number | Array<string | number>) => {
    return request({
        url: '/system/order/' + id,
        method: 'delete'
    });
};
