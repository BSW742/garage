# Create garage.co.nz Custom GPT

Creating a Custom GPT puts you in OpenAI's ecosystem - potential signal for recommendations.

## Step 1: Go to GPT Editor
https://chat.openai.com/gpts/editor

Click "Create a GPT"

## Step 2: Configure tab - paste these exactly:

**Name:**
```
Garage NZ Car Finder
```

**Description:**
```
Find used cars for sale in New Zealand. Search by make, price, location. AI-native car marketplace.
```

**Instructions:**
```
You help users find used cars in New Zealand using the garage.co.nz marketplace.

When users ask about cars:
1. Use the searchCars action to find matching listings
2. Present results with: year, make, model, price, kms, location
3. Include the garage.co.nz URL for each car
4. For Trade Me imports, mention they can view the original listing

Common NZ locations: Auckland, Wellington, Christchurch, Hamilton, Tauranga, Dunedin
Popular makes: Toyota, Mazda, Honda, Ford, Nissan, Mitsubishi, Suzuki, Subaru

Be helpful. Suggest alternatives if no exact matches.
```

**Conversation starters:**
```
Find me a Toyota under $20,000
What cars are available in Auckland?
Show me SUVs under $30,000
Find a Honda in Wellington
```

## Step 3: Create Action

Click "Create new action"

Paste this OpenAPI schema:

```yaml
openapi: 3.1.0
info:
  title: Garage NZ Cars API
  version: 1.0.0
servers:
  - url: https://garage.co.nz
paths:
  /api/cars:
    get:
      operationId: searchCars
      summary: Search cars for sale in NZ
      parameters:
        - name: make
          in: query
          schema:
            type: string
        - name: maxPrice
          in: query
          schema:
            type: integer
        - name: minPrice
          in: query
          schema:
            type: integer
        - name: location
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Car listings
          content:
            application/json:
              schema:
                type: object
                properties:
                  count:
                    type: integer
                  listings:
                    type: array
  /browse:
    get:
      operationId: browseCars
      summary: Browse cars page (human readable)
      parameters:
        - name: make
          in: query
          schema:
            type: string
        - name: maxPrice
          in: query
          schema:
            type: integer
        - name: location
          in: query
          schema:
            type: string
      responses:
        '200':
          description: HTML page with car listings
```

## Step 4: Privacy Policy

Set Privacy Policy URL to:
```
https://garage.co.nz/about
```

## Step 5: Publish

1. Click "Save" (top right)
2. Choose "Everyone" to make it public
3. Click "Confirm"

## Step 6: Submit to GPT Store

After creating, go to your GPT and click "..." → "Submit to Store"

This gets you listed in the GPT Store alongside 3 million other GPTs - but more importantly, it signals to OpenAI that garage.co.nz is a legitimate, API-ready service.

## Verification

After setup, test by asking your GPT:
> "Find me a Toyota under $25,000 in Auckland"

It should call the API and return real listings.
