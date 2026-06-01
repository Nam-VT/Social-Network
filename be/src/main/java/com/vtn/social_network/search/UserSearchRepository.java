package com.vtn.social_network.search;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface UserSearchRepository extends ElasticsearchRepository<UserDocument, Long> {

    List<UserDocument> findByUsernameMatchesOrFullNameMatches(String username, String fullName);
}
