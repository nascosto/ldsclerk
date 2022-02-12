javascript:(function () {
    const memberListUrl = 'https://lcr.churchofjesuschrist.org/services/umlu/report/member-list?unitNumber=464449';
    const memberImageUrl = 'https://lcr.churchofjesuschrist.org/services/photos/manage-photos/approved-image-individual/';

    downloadMemberPhotos(true);

    async function downloadMemberPhotos(onlyYouth) {
        let members = await getJson(memberListUrl);
        if (onlyYouth) {
            members = members.filter(member => member.age >= 11 && member.age <= 18);
        }
        for (member of members) {
            var dataUrl = await getMemberDataUrl(member);
            if (dataUrl) {
                saveImage(dataUrl, member.nameListPreferredLocal);
            }
        }
    }

    async function getMemberDataUrl(member) {
        let image = await getJson(memberImageUrl + member.legacyCmisId);
        if (!image.image.tokenUrl.includes('nophoto.svg')) {
            return await getDataURL(image.image.tokenUrl + '/MEDIUM');
        }
        return null;
    }

    function saveImage(imageUrl, name) {
        var a = document.createElement('a');
        a.style = 'display: none';
        a.href = imageUrl;
        a.download = name + '.jpg';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        delete a;
    }

    function getDataURL(url) {
        return request({ method: 'GET', url: url, responseType: 'blob' }).then(data => {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result);
                };
                reader.readAsDataURL(data);
            });
        });
    }

    function getJson(url) {
        return request({ method: 'GET', url: url }).then(data => {
            return JSON.parse(data);
        });
    }

    function request(obj) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open(obj.method || 'GET', obj.url);
            if (obj.headers) {
                Object.keys(obj.headers).forEach(key => {
                    xhr.setRequestHeader(key, obj.headers[key]);
                });
            }
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(xhr.statusText);
                }
            };
            if (obj.responseType) {
                xhr.responseType = obj.responseType;
            }
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send(obj.body);
        });
    }
}());
