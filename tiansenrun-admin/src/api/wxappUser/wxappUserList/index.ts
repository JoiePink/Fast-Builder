import request from '@/utils/request';

// 获取用户邀请列表
export const inviteUserList = (data: any) => {
    return request({
        url: '/api/admin/user/inviteUserList',
        method: 'get',
        params: data
    });
};

// 用户提现记录 列表
export const userWithdraw = (data: any) => {
    return request({
        url: '/api/admin/user/userWithdraw/list',
        method: 'get',
        params: data
    });
};

// 账户变更记录 列表
export const userAccountLog = (data: any) => {
    return request({
        url: '/api/admin/user/accountLog/list',
        method: 'get',
        params: data
    });
};

// 变更用户锁定状态
export const userChangeStatus = (data: any) => {
    return request({
        url: '/api/admin/user/changeStatus',
        method: 'post',
        data: data
    });
};

/**
 * 查询app用户信息列表
 * @param query
 * @returns {*}
 */

export const listUser = (query?: any) => {
    return request({
        url: '/api/admin/user/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询app用户信息详细
 * @param id
 */
export const getUser = (id: any) => {
    return request({
        url: '/api/admin/user/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增app用户信息
 * @param data
 */
export const addUser = (data: any) => {
    return request({
        url: '/system/user',
        method: 'post',
        data: data
    });
};

/**
 * 修改app用户信息
 * @param data
 */
export const updateUser = (data: any) => {
    return request({
        url: '/api/admin/user/update',
        method: 'post',
        data: data
    });
};

/**
 * 删除app用户信息
 * @param id
 */
export const delUser = (id: string | number | Array<string | number>) => {
    return request({
        url: '/system/user/' + id,
        method: 'delete'
    });
};
