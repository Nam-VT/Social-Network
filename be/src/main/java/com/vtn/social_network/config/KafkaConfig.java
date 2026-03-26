package com.vtn.social_network.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic chatTopic() {
        return TopicBuilder.name("chat-messages")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic notificationTopic() {
        return TopicBuilder.name("notifications")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic postActivitiesTopic() {
        return TopicBuilder.name("post-activities")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic searchIndexingTopic() {
        return TopicBuilder.name("search-indexing")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
