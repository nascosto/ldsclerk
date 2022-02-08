javascript:(function () {
    const membersWithCallingsUrl = 'https://lcr.churchofjesuschrist.org/services/report/members-with-callings';
    const subOrgNameHeirarchyUrl = 'https://lcr.churchofjesuschrist.org/services/orgs/sub-org-name-hierarchy';
    const memberCardUrl = 'https://lcr.churchofjesuschrist.org/services/member-card?includePriesthood=true&lang=eng&type=INDIVIDUAL&id=';

    const overrides = {
        'Aaronic Priesthood Quorums': 'Bishop',
        'Auditor': 'Stake President',
        'Bishopric': 'Stake President',
        'Elders Quorum': 'Bishop',
        'Institute Teacher': 'Stake President',
        'Missionary': 'Full-Time Missionaries',
        'Other Callings': 'Bishop',
        'Primary': 'Bishop',
        'Primary Activities - Boys 7 & 8': 'Primary Second Counselor',
        'Primary Activities - Boys 9 & 10': 'Primary Second Counselor',
        'Primary Activities - Girls 7': 'Primary Second Counselor',
        'Primary Activities - Girls 8': 'Primary Second Counselor',
        'Primary Activities - Girls 9 & 10': 'Primary Second Counselor',
        'Relief Society': 'Bishop',
        'Stake Baptism Coordinator': 'Stake President',
        'Stake Clerk': 'Stake President',
        'Stake High Councilor': 'Stake President',
        'Sunday School': 'Bishop',
        'Technology Specialist': 'Technology',
        'Temple and Family History': 'Bishop',
        'Ward Missionaries': 'Bishop',
        'Young Women': 'Bishop',
    };

    generateCallingsList();

    function generateCallingsList() {
        getJson(subOrgNameHeirarchyUrl)
            .then(subOrgs => {
                let subOrgsAsMembers = getSubOrgsAsMembers(subOrgs, null);
                getJson(membersWithCallingsUrl)
                    .then(members => processMembers(members, subOrgsAsMembers))
                    .catch(error => console.error('Failed to get member calling list.'));
            })
            .catch(error => console.error('Failed to get sub-org name heirarchy.'));
    }

    function getSubOrgsAsMembers(subOrgs, parent) {
        let subOrgsAsMembers = [];
        for (let subOrg of subOrgs) {
            let childrenAsMembers = getSubOrgsAsMembers(subOrg.children, subOrg);
            subOrgsAsMembers = subOrgsAsMembers.concat(childrenAsMembers);
            let subOrgAsMember = {
                id: subOrg.subOrgId,
                organization: parent ? parent.name : subOrg.name,
                parentSubOrgId: parent ? parent.subOrgId : null,
                position: subOrg.name,
                subOrgId: subOrg.subOrgId,
                supervisorId: parent ? parent.subOrgId : null,
            };
            subOrgsAsMembers.push(subOrgAsMember);
        }
        return subOrgsAsMembers;
    }

    function processMembers(members, subOrgsAsMembers) {
        setSupervisors(members);
        uniquifyIds(members);
        members = members.concat(subOrgsAsMembers);
        applySupervisorOverrides(members);

        let headers = getHeaders(members);

        let csv = sanitize(headers).join(',') + '\n';

        for (let member of members) {
            csv += getRow(member, headers) + '\n';
        }
        saveCSV(csv);
    }

    function setSupervisors(members) {
        for (let member of members) {
            member.supervisorId = member.subOrgId;
        }
    }

    function applySupervisorOverrides(members) {
        for (let member of members) {
            let overridePosition = overrides[member.position];
            if (overridePosition) {
                let supervisor = members.find(m => m.position === overridePosition);
                if (supervisor) {
                    member.supervisorId = supervisor.id;
                }
            }
        }
    }

    function uniquifyIds (members) {
        for (let i = 0; i < members.length; i++) {
            let ids = members.map(m => m.id);
            let member = members[i];
            let lastIndexOfId = ids.lastIndexOf(member.id);
            if (lastIndexOfId >= 0 && lastIndexOfId !== i) {
                member.id = member.id * 10;
            }
        }
    }

    function getHeaders(members) {
        if (members.length === 0) {
            return [];
        }
        return Object.keys(members[0]);
    }

    function getRow(member, headers) {
        return headers.map(header => sanitize(member[header])).join(',');
    }

    function sanitize(value) {
        if (Array.isArray(value)) {
            return value.map(v => {
                if (isString(v)) {
                    return '"' + v + '"';
                }
                return v;
            });
        } else if (isString(value)) {
            return '"' + value + '"';
        }
        return value;
    }

    function isString(value) {
        return typeof value === 'string' || value instanceof String;
    }

    function saveCSV(text) {
        let blob = new Blob([text], {type: 'text/plain'});

        var a = document.createElement('a');
        a.style = 'display: none';
        a.href = window.URL.createObjectURL(blob);
        a.download = 'membersWithCallings.csv';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
