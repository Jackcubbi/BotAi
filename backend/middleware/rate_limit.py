from slowapi import Limiter


def _safe_rate_limit_key(request) -> str:
	try:
		xff = request.headers.get("x-forwarded-for")
		if xff:
			client_ip = xff.split(",")[0].strip()
			if client_ip:
				return client_ip

		if request.client and request.client.host:
			return request.client.host
	except Exception:
		pass

	return "global"


limiter = Limiter(key_func=_safe_rate_limit_key, default_limits=["100/minute"])
