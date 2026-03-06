const { upstreamRequest } = require('../../../helpers/upstreamHttp');

function createClientGateway() {
  return {
    getCurrentUserList(token, { accessToken, groupId, pageIndex, pageSize }) {
      return upstreamRequest({
        method: 'GET',
        url: '/open/v1/dev/user/current-user',
        token,
        params: {
          access_token: accessToken,
          group_id: groupId,
          page_index: pageIndex,
          page_size: pageSize
        }
      });
    },

    
  };
}

module.exports = {
  createClientGateway
};
