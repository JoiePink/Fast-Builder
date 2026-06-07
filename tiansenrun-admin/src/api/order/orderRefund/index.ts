import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { OrderRefundVO, OrderRefundForm, OrderRefundQuery } from '@/api/order/orderRefund/types';

// 退款订单审核
export const orderRefundVerify = (data: any) => {
    return request({
        url: '/admin/order/refund/verify',
        method: 'post',
        data: data
    });
};

/**
 * 查询用户订单退款信息列表
 * @param query
 * @returns {*}
 */

export const listOrderRefund = (query?: any) => {
    return request({
        url: '/admin/order/refund/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询用户订单退款信息详细
 * @param id
 */
export const getOrderRefund = (orderId: any) => {
    return request({
        url: '/admin/order/refund/detail',
        method: 'get',
        params: { orderId }
    });
};

/**
 * 新增用户订单退款信息
 * @param data
 */
export const addOrderRefund = (data: any) => {
    return request({
        url: '/system/orderRefund',
        method: 'post',
        data: data
    });
};

/**
 * 修改用户订单退款信息
 * @param data
 */
export const updateOrderRefund = (data: any) => {
    return request({
        url: '/system/orderRefund',
        method: 'put',
        data: data
    });
};

/**
 * 删除用户订单退款信息
 * @param id
 */
export const delOrderRefund = (id: string | number | Array<string | number>) => {
    return request({
        url: '/system/orderRefund/' + id,
        method: 'delete'
    });
};
