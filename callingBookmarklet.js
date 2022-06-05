javascript:(function () {
    const membersWithCallingsUrl = 'https://lcr.churchofjesuschrist.org/services/report/members-with-callings';
    const subOrgNameHeirarchyUrl = 'https://lcr.churchofjesuschrist.org/services/orgs/sub-org-name-hierarchy';
    const imageUrl = 'https://lcr.churchofjesuschrist.org/services/photos/manage-photos/approved-image-individual/';

    const ignoredSubOrgs = [
        'Additional Aaronic Priesthood Quorums Callings',
        'Additional Callings',
        'Church Magazines',
        'Deacons Quorum Additional Callings',
        'For the Strength of Youth',
        'History',
        'Priests Quorum Additional Callings',
        'Primary Presidency',
        'Presidency of the Aaronic Priesthood',
        'Single Adult',
        'Sunbeam',
        'Teachers Quorum Additional Callings',
        'Young Women 12-13 Additional Callings',
        'Young Women 14-15 Additional Callings',
        'Young Women 16-18 Additional Callings',
    ];

    const overrides = {
        'Aaronic Priesthood Quorums': 'Bishop',
        'Auditor': 'Stake President',
        'Bishopric': 'Stake President',
        'Elders Quorum': 'Bishop',
        'Institute Teacher': 'Stake President',
        'Missionary': 'Full-Time Missionaries',
        'Other Callings': 'Bishopric First Counselor',
        'Relief Society': 'Bishop',
        'Stake Baptism Coordinator': 'Stake President',
        'Stake Clerk': 'Stake President',
        'Stake High Councilor': 'Stake President',
        'Stake Temple and Family History Consultant': 'Stake President',
        'Sunday School': 'Bishopric First Counselor',
        'Technology Specialist': 'Technology',
        'Temple and Family History': 'Elders Quorum President',
        'Ward Missionaries': 'Relief Society President',
        'Young Women': 'Bishop',
        'Ward Assistant Clerk--Finance': 'Ward Clerk',
        'Ward Assistant Clerk--Membership': 'Ward Clerk',

        'Primary': 'Bishopric Second Counselor',
        'Primary President': 'Primary',
        'Primary First Counselor': 'Primary President',
        'Primary Second Counselor': 'Primary President',
        'Primary Secretary': 'Primary President',
        'Nursery': 'Primary Secretary',
        'Sunbeam': 'Primary Secretary',
        'Sunbeam & CTR 4': 'Primary Secretary',
        'CTR 4': 'Primary Secretary',
        'CTR 5': 'Primary Secretary',
        'CTR 6': 'Primary Secretary',
        'CTR 7': 'Primary Secretary',
        'Valiant 8': 'Primary First Counselor',
        'Valiant 8 & 9': 'Primary First Counselor',
        'Valiant 9': 'Primary First Counselor',
        'Valiant 10 A': 'Primary First Counselor',
        'Valiant 10 B': 'Primary First Counselor',
        'Primary Activities - Boys 7 & 8': 'Primary Second Counselor',
        'Primary Activities - Boys 9 & 10': 'Primary Second Counselor',
        'Primary Activities - Girls 7': 'Primary Second Counselor',
        'Primary Activities - Girls 8': 'Primary Second Counselor',
        'Primary Activities - Girls 9 & 10': 'Primary Second Counselor',
        'Primary Music': 'Primary President',
        'Primary Unassigned Teachers': 'Primary President',
    };

    generateCallingsList();

    async function generateCallingsList() {
        let subOrgs = await getJson(subOrgNameHeirarchyUrl);
        let subOrgsAsMembers = getSubOrgsAsMembers(subOrgs, null);
        subOrgsAsMembers = subOrgsAsMembers.filter(subOrg => !ignoredSubOrgs.includes(subOrg.position));
        let members = await getJson(membersWithCallingsUrl);
        processMembers(members, subOrgsAsMembers);
    }

    async function getMemberDataUrl(member) {
        let image = await getJson(imageUrl + member.id);
        if (!image.image.tokenUrl.includes('nophoto.svg')) {
            let dataUrl = await getDataURL(image.image.tokenUrl + '/MEDIUM');
            member.dataUrl = dataUrl;
        }
        return member;
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
        setNumberOfMonthsInCalling(members);
        setNumberOfCallings(members);
        uniquifyIds(members);
        members = members.concat(subOrgsAsMembers);
        applySupervisorOverrides(members);

        let headers = getHeaders(members);

        members.sort(sortBy('name'));
        members.sort(sortBy('position'));

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
            let overridePosition = overrides[member.organization + " " + member.position] || overrides[member.position];
            if (overridePosition) {
                let supervisor = members.find(m => m.position === overridePosition);
                if (supervisor) {
                    member.supervisorId = supervisor.id;
                }
            }
        }
    }

    function setNumberOfMonthsInCalling(members) {
        let now = new Date();
        for (let member of members) {
            member.numberOfMonthsInCalling = monthDiff(new Date(member.sustainedDate), now);
        }
    }

    function monthDiff(d1, d2) {
        var months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months <= 0 ? 0 : months;
    }

    function setNumberOfCallings(members) {
        for (let member of members) {
            let matches = members.filter(m => m.id === member.id);
            member.numberOfCallings = matches.length;
        }
    }

    function uniquifyIds(members) {
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
        return members.length === 0 ? [] : Object.keys(members[0]).sort();
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

    function sortBy(field) {
        return function(a, b) {
            return (a[field] > b[field]) - (a[field] < b[field])
        };
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
