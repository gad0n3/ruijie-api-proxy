function extractAccessToken(token) {
  if (!token) {
    return '';
  }

  const parts = String(token).split('::');

  if (parts.length === 2) {
    return parts[1].trim();
  }

  return String(token).trim();
}

function collectLeafGroups(node) {
  if (!node || typeof node !== 'object') {
    return [];
  }

  const subGroups = Array.isArray(node.subGroups) ? node.subGroups : [];

  if (subGroups.length === 0) {
    if (!node.name || !node.groupId || Number(node.groupId) === 0) {
      return [];
    }

    return [
      {
        name: node.name,
        groupId: node.groupId
      }
    ];
  }

  return subGroups.flatMap(collectLeafGroups);
}

function validateGroupTreeResponse(response) {
  if (Number(response?.code) !== 0) {
    const error = new Error(response?.msg || 'Failed to get network groups from upstream.');
    error.statusCode = 502;
    error.details = response;
    throw error;
  }
}

function createNetworkGroupUseCases({ networkGroupGateway }) {
  return {
    async listNetworkGroups(token) {
      const accessToken = extractAccessToken(token);
      const upstreamResponse = await networkGroupGateway.getGroupTree(token, accessToken);

      validateGroupTreeResponse(upstreamResponse);

      return collectLeafGroups(upstreamResponse?.groups);
    }
  };
}

module.exports = {
  createNetworkGroupUseCases
};
