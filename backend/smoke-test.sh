#!/bin/bash

# Check if URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./smoke-test.sh <api_endpoint_url>"
    exit 1
fi

# Remove trailing slash if present
API_URL=${1%/}
ITEM_ID="smoke-test-$(date +%s)"

echo "Testing with ITEM_ID: $ITEM_ID"
echo "API_URL: $API_URL"

# 1. Create Item
echo -e "\n1. Creating item..."
CREATE_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/items" \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"$ITEM_ID\", \"name\": \"Smoke Test Item\", \"description\": \"Created by smoke test\"}")
CREATE_CODE=$(echo "$CREATE_RES" | tail -n 1)
echo "Status: $CREATE_CODE"
if [ "$CREATE_CODE" != "201" ]; then echo "Failed create"; exit 1; fi

# 2. Get Item
echo -e "\n2. Getting item..."
GET_RES=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/items/$ITEM_ID")
GET_CODE=$(echo "$GET_RES" | tail -n 1)
echo "Status: $GET_CODE"
if [ "$GET_CODE" != "200" ]; then echo "Failed get"; exit 1; fi

# 3. Update Item
echo -e "\n3. Updating item..."
UPDATE_RES=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/items/$ITEM_ID" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Updated Smoke Name\"}")
UPDATE_CODE=$(echo "$UPDATE_RES" | tail -n 1)
echo "Status: $UPDATE_CODE"
if [ "$UPDATE_CODE" != "200" ]; then echo "Failed update"; exit 1; fi

# 4. Conflict Test (Create same ID)
echo -e "\n4. Testing conflict (duplicate ID)..."
CONFLICT_RES=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/items" \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"$ITEM_ID\", \"name\": \"Duplicate\"}")
CONFLICT_CODE=$(echo "$CONFLICT_RES" | tail -n 1)
echo "Status: $CONFLICT_CODE (Expected 409)"
if [ "$CONFLICT_CODE" != "409" ]; then echo "Failed conflict test"; exit 1; fi

# 5. Delete Item
echo -e "\n5. Deleting item..."
DELETE_RES=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/items/$ITEM_ID")
DELETE_CODE=$(echo "$DELETE_RES" | tail -n 1)
echo "Status: $DELETE_CODE"
if [ "$DELETE_CODE" != "204" ]; then echo "Failed delete"; exit 1; fi

# 6. Not Found Test (Get deleted ID)
echo -e "\n6. Testing not found..."
NF_RES=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/items/$ITEM_ID")
NF_CODE=$(echo "$NF_RES" | tail -n 1)
echo "Status: $NF_CODE (Expected 404)"
if [ "$NF_CODE" != "404" ]; then echo "Failed not found test"; exit 1; fi

echo -e "\nSmoke test PASSED!"
