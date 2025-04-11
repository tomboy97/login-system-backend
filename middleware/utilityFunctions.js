const buildingSlackMessage = (tasks, heading) => {
    return {
        blocks: [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `${heading}`,
                    "emoji": true
                }
            },
            { 
                "type": "rich_text",
                "elements": [
                    {
                        "type": "rich_text_list",
                        "style": "bullet",
                        "indent": 0,
                        "border": 0,
                        "elements": tasks.map(task => ({
                          "type": "rich_text_section",
                          "elements": [
                            { "type": "text", "text": `${task.name}: ${task.desc}` }
                          ]
                        }))
                    }
                ]
            }
        ]
    };
};

module.exports = buildingSlackMessage;