resource "aws_cloudwatch_event_bus" "main" {
  name = "${var.project_name}-bus"
}

# Example rule to catch all events from our source
resource "aws_cloudwatch_event_rule" "catch_all" {
  name           = "${var.project_name}-catch-all"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["myapp.items"]
  })
}

# Target for the rule (e.g. CloudWatch Logs)
resource "aws_cloudwatch_log_group" "events" {
  name              = "/aws/events/${var.project_name}-events"
  retention_in_days = 7
}

resource "aws_cloudwatch_event_target" "log_group" {
  rule           = aws_cloudwatch_event_rule.catch_all.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = aws_cloudwatch_log_group.events.arn
}

# Allow EventBridge to write to CloudWatch Logs
resource "aws_cloudwatch_log_resource_policy" "eventbridge_to_cw" {
  policy_name = "${var.project_name}-eb-to-cw"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.events.arn}:*"
      }
    ]
  })
}
