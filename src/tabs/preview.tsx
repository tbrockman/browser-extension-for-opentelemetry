import IndexPopup from "~popup"

import '~tabs/preview.css'

export default function PreviewPage() {
    return process.env.NODE_ENV === 'development' ? <IndexPopup /> : null
}