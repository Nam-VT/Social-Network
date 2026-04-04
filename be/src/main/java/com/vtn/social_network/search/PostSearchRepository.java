package com.vtn.social_network.search;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface PostSearchRepository extends ElasticsearchRepository<PostDocument, Long> {

    List<PostDocument> findByContentContaining(String content);
}
