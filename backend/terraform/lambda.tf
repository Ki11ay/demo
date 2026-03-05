locals {
  handlers = ["createItem", "getItem", "updateItem", "deleteItem"]
}

data "archive_file" "lambda_zip" {
  for_each    = toset(local.handlers)
  type        = "zip"
  source_file = "${path.module}/../dist/${each.key}.js"
  output_path = "${path.module}/../dist/${each.key}.zip"
}

resource "aws_lambda_function" "crud_handlers" {
  for_each         = toset(local.handlers)
  function_name    = "${var.project_name}-${each.key}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "${each.key}.handler"
  filename         = data.archive_file.lambda_zip[each.key].output_path
  source_code_hash = data.archive_file.lambda_zip[each.key].output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      TABLE_NAME     = aws_dynamodb_table.items.name
      EVENT_BUS_NAME = aws_cloudwatch_event_bus.main.name
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each          = toset(local.handlers)
  name              = "/aws/lambda/${aws_lambda_function.crud_handlers[each.key].function_name}"
  retention_in_days = 7
}
