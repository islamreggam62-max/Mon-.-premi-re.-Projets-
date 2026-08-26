"""بوابة الأذونات (Authorization guardrail).

هذه الوحدة هي صمّام الأمان في المنسّق. لا يُسمح لأي وحدة فحص بالعمل ضد أي
هدف قبل التأكّد من أنه داخل نطاق أذونات مُعلَن ومُوثَّق صراحةً.

مبادئ التصميم
-------------
* **المنع افتراضيًا.** بدون ملف أذونات، لا شيء يعمل.
* **إقرار صريح.** على المشغّل ضبط ``i_am_authorized: true`` وذكر اسمه. هذه
  عقبة متعمَّدة تُلزم الإنسان بالإقرار بأنه يملك التصريح قبل أن يفعل الأداة أي شيء.
* **النطاق قائمة سماح.** فقط المضيفون/نطاقات CIDR المذكورون في ``scope`` قابلون
  للفحص. وكل ما عداهم يُرفَض، حتى عن طريق الخطأ.
* **محلي فقط افتراضيًا.** ما لم يُفعَّل ``allow_nonlocal`` صراحةً، لا يقبل النطاق
  إلا عناوين الحلقة المحلية / الخاصة (RFC 1918) / المحلية للوصلة، بحيث لا يمكن
  لأي تشغيل جاهز أن يصل إلى الإنترنت العام.
"""

from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

try:
    import yaml
except ImportError as exc:  # pragma: no cover - dependency hint
    raise SystemExit(
        "‏PyYAML مطلوبة. ثبّت الاعتماديات عبر: pip install -r requirements.txt"
    ) from exc


class AuthorizationError(Exception):
    """يُطلَق كلما كان هدف أو إعداد غير مُصرَّح به."""


@dataclass
class Authorization:
    operator: str
    engagement: str
    i_am_authorized: bool
    scope: list[str]
    expires: date | None = None
    allow_nonlocal: bool = False
    _networks: list[ipaddress._BaseNetwork] = field(default_factory=list, repr=False)

    @classmethod
    def load(cls, path: str | Path) -> "Authorization":
        path = Path(path)
        if not path.exists():
            raise AuthorizationError(
                f"‏لا يوجد ملف أذونات في '{path}'. انسخ authorization.example.yaml، "
                "واملأ نطاقك، وأقرّ بأنك مُصرَّح لك قبل التشغيل."
            )
        data = yaml.safe_load(path.read_text()) or {}

        missing = [k for k in ("operator", "engagement", "scope") if not data.get(k)]
        if missing:
            raise AuthorizationError(f"‏ملف الأذونات تنقصه حقول: {', '.join(missing)}")

        if data.get("i_am_authorized") is not True:
            raise AuthorizationError(
                "‏رفض التشغيل: اضبط 'i_am_authorized: true' في ملف الأذونات فقط إن كان "
                "لديك تصريح كتابي لاختبار كل مضيف في النطاق."
            )

        expires = data.get("expires")
        if isinstance(expires, str):
            expires = date.fromisoformat(expires)
        if isinstance(expires, date) and expires < date.today():
            raise AuthorizationError(
                f"‏انتهت صلاحية الأذونات بتاريخ {expires.isoformat()}. جدّدها قبل الفحص."
            )

        auth = cls(
            operator=str(data["operator"]),
            engagement=str(data["engagement"]),
            i_am_authorized=True,
            scope=[str(s) for s in data["scope"]],
            expires=expires if isinstance(expires, date) else None,
            allow_nonlocal=bool(data.get("allow_nonlocal", False)),
        )
        auth._compile_scope()
        return auth

    def _compile_scope(self) -> None:
        networks: list[ipaddress._BaseNetwork] = []
        for entry in self.scope:
            for net in self._resolve_entry(entry):
                if not self.allow_nonlocal and not self._is_local(net):
                    raise AuthorizationError(
                        f"‏عنصر النطاق '{entry}' ({net}) عنوان عام. "
                        "مرفوض افتراضيًا. إن كان لديك فعلاً تصريح لهدف غير محلي، "
                        "فاضبط 'allow_nonlocal: true' صراحةً."
                    )
                networks.append(net)
        if not networks:
            raise AuthorizationError("‏نطاق الأذونات لم يُحدِّد أي هدف.")
        self._networks = networks

    @staticmethod
    def _resolve_entry(entry: str) -> list[ipaddress._BaseNetwork]:
        # نطاق CIDR أو عنوان IP مجرّد يُحلّ مباشرةً؛ اسم المضيف يُحلّ عبر DNS.
        try:
            return [ipaddress.ip_network(entry, strict=False)]
        except ValueError:
            pass
        try:
            infos = socket.getaddrinfo(entry, None)
        except socket.gaierror as exc:
            raise AuthorizationError(f"‏تعذّر تحليل مضيف النطاق '{entry}': {exc}") from exc
        nets = []
        for info in infos:
            ip = info[4][0]
            nets.append(ipaddress.ip_network(ip, strict=False))
        return nets

    @staticmethod
    def _is_local(net: ipaddress._BaseNetwork) -> bool:
        return net.is_private or net.is_loopback or net.is_link_local

    def check(self, target: str) -> None:
        """يُطلق AuthorizationError ما لم يكن *target* داخل النطاق."""
        try:
            addr = ipaddress.ip_address(target)
            candidates = [addr]
        except ValueError:
            try:
                infos = socket.getaddrinfo(target, None)
            except socket.gaierror as exc:
                raise AuthorizationError(f"‏تعذّر تحليل الهدف '{target}': {exc}") from exc
            candidates = [ipaddress.ip_address(i[4][0]) for i in infos]

        for addr in candidates:
            if any(addr in net for net in self._networks):
                return
        raise AuthorizationError(
            f"‏الهدف '{target}' خارج النطاق المُصرَّح به. رفض المساس به."
        )

    def is_authorized(self, target: str) -> bool:
        try:
            self.check(target)
            return True
        except AuthorizationError:
            return False
