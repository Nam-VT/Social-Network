package com.vtn.social_network.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String content;

    @Field(type = FieldType.Long)
    private Long authorId;

    @Field(type = FieldType.Keyword)
    private String authorUsername;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String authorFullName;

    @Field(type = FieldType.Keyword)
    private String visibility;

    @Field(type = FieldType.Long)
    private Long createdAt;
}
