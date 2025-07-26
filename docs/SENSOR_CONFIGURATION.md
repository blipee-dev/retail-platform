# Sensor Configuration Guide

## Overview

This document explains how to properly configure sensor IPs and connectivity settings for the blipee OS Retail Intelligence platform.

## Current Sensor Mappings

The following sensors need their host configurations updated in the database:

| Sensor | Current (Incorrect) | Correct Host |
|--------|-------------------|--------------|
| OML01 - Omnia Guimarães Shopping | 10.0.0.3 | 62.28.114.102:21001 |
| OML02 - Omnia Fórum Almada | 10.0.0.4 | 62.28.114.102:21002 |
| OML03 - Omnia NorteShopping | 10.0.0.2 | 188.37.124.33:21002 |

## How to Update Sensor IPs

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to Table Editor → `sensor_metadata`
3. Find the sensors by their `sensor_id` or `sensor_name`
4. Update the `host` field with the correct IP:port combination

### Option 2: Using SQL Migration

Run the migration script in Supabase SQL Editor:
```sql
-- Update sensor hosts
UPDATE sensor_metadata 
SET host = CASE sensor_id
    WHEN 'ffc2438a-ee4f-4324-96da-08671ea3b23c' THEN '62.28.114.102:21001'
    WHEN 'f63ef2e9-344e-4373-aedf-04dd05cf8f8b' THEN '62.28.114.102:21002'
    WHEN '7976051c-980b-45e1-b099-45d032f3c7aa' THEN '188.37.124.33:21002'
    ELSE host
END
WHERE sensor_id IN (
    'ffc2438a-ee4f-4324-96da-08671ea3b23c',
    'f63ef2e9-344e-4373-aedf-04dd05cf8f8b',
    '7976051c-980b-45e1-b099-45d032f3c7aa'
);
```

### Option 3: Environment-Based Configuration (Future Enhancement)

In production, sensor configurations should ideally be managed through:
- Environment variables
- Configuration management system
- Secure vault for sensitive data

## Verifying Connectivity

After updating the sensor IPs, verify connectivity:

1. Run the connectivity check script:
```bash
node scripts/debug/check-sensor-connectivity.js
```

2. Check the GitHub Actions logs for successful data collection

## Security Considerations

- Never commit real sensor credentials to the repository
- Use GitHub Secrets for authentication in workflows
- Consider implementing IP whitelisting on sensor devices
- Use HTTPS if sensors support it

## Troubleshooting

### Common Issues

1. **Network Timeout Errors**
   - Verify the sensor is accessible from your network
   - Check firewall rules
   - Ensure the port is correct

2. **Authentication Failures**
   - Verify credentials in GitHub Secrets
   - Check sensor authentication settings

3. **Private Network Access**
   - GitHub Actions cannot access private IPs (10.x.x.x, 192.168.x.x)
   - Consider using self-hosted runners or VPN solutions